// Encryption function (simple implementation)
function encrypt(key) {
    return btoa(key); // Base64 encoding as a simple encryption
}

// Debug logging function
function debugLog(message, data) {
    console.log(`🔍 DEBUG: ${message}`, data);
}

// Database Configuration
const DATABASE_MODE = {
    SUPABASE: 'supabase',
    SQLITE: 'sqlite'
};

// Current database mode (default to SQLite)
let currentDatabaseMode = DATABASE_MODE.SQLITE;

// Database connection objects
let supabaseClient = null;
let sqliteClient = null;

// Initialize database connections
async function initializeDatabaseConnections() {
    try {
        // Supabase initialization (if needed)
        supabaseClient = window.createClient ? window.createClient('https://tkcrnfgnspvtzwbbvyfv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8') : null;

        // SQLite initialization (using fetch to simulate SQLite interaction)
        const sqliteResponse = await fetch('local_database.sqlite');
        if (sqliteResponse.ok) {
            sqliteClient = {
                // Simulated SQLite client methods
                fetchQuestions: async (filters = {}) => {
                    const response = await fetch('/api/sqlite/questions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(filters)
                    });
                    return response.json();
                },
                // Add more methods as needed
            };
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Switch database mode
function switchDatabaseMode(mode) {
    if (Object.values(DATABASE_MODE).includes(mode)) {
        currentDatabaseMode = mode;
        console.log(`Switched to ${mode} database mode`);
    } else {
        console.error('Invalid database mode');
    }
}

// Generic query method that uses the current database mode
async function queryDatabase(table, method, params = {}) {
    try {
        if (currentDatabaseMode === DATABASE_MODE.SUPABASE) {
            // Use Supabase client
            return await supabaseClient
                .from(table)
                [method](params);
        } else {
            // Use SQLite client (simulated)
            return await sqliteClient[`fetch${table.charAt(0).toUpperCase() + table.slice(1)}`](params);
        }
    } catch (error) {
        console.error(`Database query error (${currentDatabaseMode}):`, error);
        throw error;
    }
}

// Simplified authentication approach
async function testSupabaseConnection() {
    try {
        console.log('🔍 Testing Supabase Connection...');

        // Ensure supabase is initialized
        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            return false;
        }

        // Direct query using anonymous key
        const { data, error } = await queryDatabase('questions', 'select', { limit: 1 });

        if (error) {
            console.error('❌ Connection Test Failed:', error);
            
            // Display error on connection status element
            const connectionStatusElement = document.getElementById('connectionStatus');
            if (connectionStatusElement) {
                connectionStatusElement.innerHTML = `
                    <div class="connection-error">
                        <h3>Connection Error</h3>
                        <p>❌ Failed to connect to Supabase</p>
                        <p>Error: ${error.message}</p>
                    </div>
                `;
            }

            throw error;
        }

        console.log('✅ Connection Successful. Sample Data:', data);

        // Display success on connection status element
        const connectionStatusElement = document.getElementById('connectionStatus');
        if (connectionStatusElement) {
            connectionStatusElement.innerHTML = `
                <div class="connection-info">
                    <h3>Supabase Connection Status</h3>
                    <p>✅ Connected Successfully</p>
                    <p>URL: ${'https://tkcrnfgnspvtzwbbvyfv.supabase.co'}</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `;
        }

        return true;
    } catch (err) {
        console.error('🚨 Unexpected Connection Error:', err);
        return false;
    }
}

// Function to get total answers for a question
async function getTotalAnswersForQuestion(questionId) {
    try {
        const { count, error } = await queryDatabase('answer_list', 'select', { count: 'exact', eq: { question_id: questionId } });

        if (error) {
            console.error('Error counting answers:', error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error('Unexpected error counting answers:', err);
        return 0;
    }
}

// Function to load all questions
async function loadAllQuestions() {
    console.log('🔍 DEBUG: Starting to load questions');
    try {
        // Fetch questions with course details
        const { data, error } = await queryDatabase('questions', 'rpc', 'get_questions_with_course');
        
        if (error) {
            console.error('Error fetching questions:', error);
            return;
        }

        // Find the questions table body
        const questionsTableBody = document.getElementById('questionsTableBody');
        
        // Validate table body exists
        if (!questionsTableBody) {
            console.error('Questions table body not found');
            return;
        }

        // Clear existing table rows
        questionsTableBody.innerHTML = '';

        // Check if data exists and is an array
        if (!data || !Array.isArray(data)) {
            console.warn('No questions found');
            return;
        }

        // Render each question as a table row
        for (const question of data) {
            // Get total answers for this question
            const answerCount = await getTotalAnswersForQuestion(question.id);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${question.question}</td>
                <td>${answerCount}</td>
                <td>${question.course_name || 'Uncategorized'}</td>
                <td>
                    <button onclick="viewQuestionDetails('${question.id}')">View</button>
                </td>
            `;
            questionsTableBody.appendChild(row);
        }

        console.log(`✅ Loaded ${data.length} questions`);
    } catch (err) {
        console.error('Unexpected error in loadAllQuestions:', err);
    }
}

// Function to view question details
async function viewQuestionDetails(questionId) {
    try {
        // Fetch full question details
        const { data, error } = await queryDatabase('questions', 'select', { eq: { id: questionId }, single: true });

        if (error) {
            console.error('Error fetching question details:', error);
            return;
        }

        // Fetch answer details
        const { data: answers, error: answersError } = await queryDatabase('answer_list', 'select', { eq: { question_id: questionId } });

        if (answersError) {
            console.error('Error fetching answers:', answersError);
            return;
        }

        // Display question details in a modal
        const questionDetailsModal = document.getElementById('questionDetailsModal');
        if (questionDetailsModal) {
            questionDetailsModal.innerHTML = `
                <div class="modal-content">
                    <h2>Question Details</h2>
                    <p><strong>Question:</strong> ${data.question}</p>
                    <p><strong>Answer:</strong> ${data.answer || 'No answer provided'}</p>
                    <h3>Answers (${answers.length}):</h3>
                    <ul>
                        ${answers.map(answer => `
                            <li>
                                ${answer.answer || 'No answer text'} 
                                (Submitted: ${new Date(answer.created_at).toLocaleString()})
                            </li>
                        `).join('')}
                    </ul>
                    <button onclick="closeQuestionDetailsModal()">Close</button>
                </div>
            `;
            questionDetailsModal.style.display = 'block';
        }
    } catch (err) {
        console.error('Unexpected error viewing question details:', err);
    }
}

// Close question details modal
function closeQuestionDetailsModal() {
    const questionDetailsModal = document.getElementById('questionDetailsModal');
    if (questionDetailsModal) {
        questionDetailsModal.style.display = 'none';
    }
}

// Function to get random question with fewest answers
async function getRandomQuestionWithFewestAnswers() {
    try {
        // Fetch questions with their answer counts
        const { data, error } = await queryDatabase('questions', 'rpc', 'get_random_question');
        
        if (error) {
            console.error('Error fetching questions:', error);
            return null;
        }

        // Filter out questions with answers
        const questionsWithoutAnswers = data.filter(q => 
            q.total_answers === 0 || q.total_answers === undefined
        );

        // If no questions without answers, get the question with the least answers
        const candidateQuestions = questionsWithoutAnswers.length > 0 
            ? questionsWithoutAnswers 
            : data.sort((a, b) => (a.total_answers || 0) - (b.total_answers || 0));

        // Select a random question from the candidates
        if (candidateQuestions.length === 0) {
            console.warn('No questions available');
            return null;
        }

        const randomQuestion = candidateQuestions[Math.floor(Math.random() * candidateQuestions.length)];

        // Get total answers for this question
        const totalAnswers = await getTotalAnswersForQuestion(randomQuestion.id);

        // Update the random question display
        const randomQuestionElement = document.getElementById('randomQuestion');
        const randomQuestionTotalAnswers = document.getElementById('randomQuestionTotalAnswers');
        const randomQuestionCourse = document.getElementById('randomQuestionCourse');

        if (randomQuestionElement) {
            randomQuestionElement.textContent = randomQuestion.question;
        }

        if (randomQuestionTotalAnswers) {
            randomQuestionTotalAnswers.textContent = totalAnswers;
        }

        if (randomQuestionCourse) {
            randomQuestionCourse.textContent = randomQuestion.course_name || 'N/A';
        }

        return randomQuestion;
    } catch (err) {
        console.error('Unexpected error getting random question:', err);
        return null;
    }
}

// Function to get random question
async function getRandomQuestion() {
    try {
        // Test connection first
        const { data: connectionTestData, error: connectionError } = await queryDatabase('questions', 'select', { limit: 1 });

        if (connectionError) {
            console.error('Connection test failed:', connectionError);
            return null;
        }

        // Fetch a random question with course details
        const { data, error } = await queryDatabase('questions', 'rpc', 'get_random_question');
        
        if (error) {
            console.error('Error fetching random question:', error);
            return null;
        }

        // Debug: Log full data
        console.log('🔍 DEBUG: Full Questions Data', data);
        console.log('🔍 DEBUG: Questions Count:', data.length);
        
        // Log each question's details
        data.forEach((q, index) => {
            console.log(`Question ${index + 1}:`, {
                id: q.id,
                question: q.question,
                course_id: q.course_id,
                course_name: q.course_name,
                total_answers: q.total_answers
            });
        });

        // Filter out questions without a course_id
        const validQuestions = data.filter(q => {
            const isValid = q.course_id !== null && q.course_id !== undefined;
            if (!isValid) {
                console.warn('Invalid question:', q);
            }
            return isValid;
        });

        // If no valid questions, return null
        if (validQuestions.length === 0) {
            console.warn('No questions available at all');
            return null;
        }

        // Select a random question
        const randomQuestion = validQuestions[Math.floor(Math.random() * validQuestions.length)];

        console.log('🎲 Selected Random Question:', randomQuestion);

        // Update the random question display
        const randomQuestionElement = document.getElementById('randomQuestion');
        const randomQuestionTotalAnswers = document.getElementById('randomQuestionTotalAnswers');
        const randomQuestionCourse = document.getElementById('randomQuestionCourse');

        if (randomQuestionElement) {
            randomQuestionElement.textContent = randomQuestion.question;
        }

        if (randomQuestionTotalAnswers) {
            // Set initial total answers count to 1
            randomQuestionTotalAnswers.textContent = '1';
        }

        if (randomQuestionCourse) {
            randomQuestionCourse.textContent = randomQuestion.course_name || 'N/A';
        }

        // Add a submit answer button to the UI
        const submitAnswerButton = document.createElement('button');
        submitAnswerButton.textContent = '提交我的答案';
        submitAnswerButton.classList.add('submit-answer-btn');
        
        // Create a textarea for answer input
        const answerTextarea = document.createElement('textarea');
        answerTextarea.placeholder = '在这里输入你的答案...';
        answerTextarea.classList.add('answer-textarea');

        // Container for answer submission
        const answerSubmissionContainer = document.getElementById('answerSubmissionContainer');
        if (answerSubmissionContainer) {
            // Clear previous content
            answerSubmissionContainer.innerHTML = '';
            
            // Add textarea and submit button
            answerSubmissionContainer.appendChild(answerTextarea);
            answerSubmissionContainer.appendChild(submitAnswerButton);

            // Add event listener for submit button
            submitAnswerButton.addEventListener('click', async () => {
                const answerText = answerTextarea.value.trim();
                
                if (!answerText) {
                    alert('请输入答案');
                    return;
                }

                // Submit the answer
                const submittedAnswer = await submitRandomQuestionAnswer(
                    randomQuestion.id, 
                    answerText
                );

                if (submittedAnswer) {
                    // Clear textarea after successful submission
                    answerTextarea.value = '';
                }
            });
        }

        return randomQuestion;
    } catch (err) {
        console.error('Error in getRandomQuestion:', err);
        return null;
    }
}

// Function to submit a new answer to the answer_list table
async function submitRandomQuestionAnswer(questionId, answerText) {
    try {
        // Get the current authenticated user
        const { data: { user }, error: userError } = await queryDatabase('auth', 'getUser');
        
        if (userError || !user) {
            console.error('User not authenticated:', userError);
            alert('请先登录');
            return null;
        }

        // Prepare the answer data
        const answerData = {
            question_id: questionId,
            answer_text: answerText,
            user_id: user.id,
            submission_time: new Date().toISOString(),
            evaluation_status: 'pending',
            difficulty_level: 'medium',
            metadata: JSON.stringify({
                source: 'random_question_submission',
                submission_method: 'get_random_question_button'
            })
        };

        // Insert the new answer
        const { data, error } = await queryDatabase('answer_list', 'insert', answerData);

        if (error) {
            console.error('Error submitting answer:', error);
            alert('提交答案失败：' + error.message);
            return null;
        }

        // Update total answers count
        await updateTotalAnswersCount(questionId);

        // Show success message
        console.log('✅ New answer submitted successfully:', data);
        alert('答案提交成功！');

        return data[0];
    } catch (err) {
        console.error('Unexpected error in submitRandomQuestionAnswer:', err);
        alert('提交过程中发生意外错误');
        return null;
    }
}

// Function to update total answers count
async function updateTotalAnswersCount(questionId) {
    try {
        // Count total answers for the specific question
        const { count, error } = await queryDatabase('answer_list', 'select', { count: 'exact', eq: { question_id: questionId } });

        if (error) {
            console.error('Error counting answers:', error);
            return null;
        }

        // Update the total answers display
        const totalAnswersElement = document.getElementById('randomQuestionTotalAnswers');
        if (totalAnswersElement) {
            // Increment the count by parsing the current value and adding 1
            const currentCount = parseInt(totalAnswersElement.textContent, 10) || 0;
            totalAnswersElement.textContent = currentCount + 1;
        }

        return count;
    } catch (err) {
        console.error('Unexpected error updating total answers:', err);
        return null;
    }
}

// Function to handle random question retrieval with visual feedback
async function handleRandomQuestionRetrieval() {
    // Get the random question button
    const randomQuestionBtn = document.getElementById('getRandomQuestionBtn');
    
    // Get status elements
    const randomQuestionElement = document.getElementById('randomQuestion');
    const randomQuestionTotalAnswers = document.getElementById('randomQuestionTotalAnswers');
    const randomQuestionCourse = document.getElementById('randomQuestionCourse');
    const randomQuestionStatus = document.getElementById('randomQuestionStatus');

    // Disable button and show loading state
    if (randomQuestionBtn) {
        randomQuestionBtn.disabled = true;
        randomQuestionBtn.style.backgroundColor = '#ffa500'; // Orange during loading
        randomQuestionBtn.textContent = 'Fetching Question...';
    }

    // Clear previous question and status
    if (randomQuestionElement) randomQuestionElement.textContent = '';
    if (randomQuestionTotalAnswers) randomQuestionTotalAnswers.textContent = '0';
    if (randomQuestionCourse) randomQuestionCourse.textContent = 'N/A';
    if (randomQuestionStatus) {
        randomQuestionStatus.textContent = 'Searching for a question...';
        randomQuestionStatus.style.color = '#007bff'; // Blue for loading
    }

    try {
        // Fetch a random question
        const randomQuestion = await getRandomQuestion();

        // Restore button state
        if (randomQuestionBtn) {
            randomQuestionBtn.disabled = false;
            randomQuestionBtn.style.backgroundColor = ''; // Reset to default
            randomQuestionBtn.textContent = 'Get Random Question';
        }

        // Update status based on result
        if (randomQuestion) {
            if (randomQuestionStatus) {
                randomQuestionStatus.textContent = 'Question found!';
                randomQuestionStatus.style.color = '#28a745'; // Green for success
            }
        } else {
            if (randomQuestionStatus) {
                randomQuestionStatus.textContent = 'No questions available.';
                randomQuestionStatus.style.color = '#dc3545'; // Red for error
            }
        }

        return randomQuestion;
    } catch (error) {
        console.error('Error retrieving random question:', error);
        
        // Update error state
        if (randomQuestionBtn) {
            randomQuestionBtn.disabled = false;
            randomQuestionBtn.style.backgroundColor = '#dc3545'; // Red for error
            randomQuestionBtn.textContent = 'Retry';
        }

        if (randomQuestionStatus) {
            randomQuestionStatus.textContent = 'Failed to retrieve question. Please try again.';
            randomQuestionStatus.style.color = '#dc3545'; // Red for error
        }

        return null;
    }
}

// Function to submit an answer
async function submitAnswer() {
    try {
        const questionId = document.getElementById('currentQuestionId').value;
        const answerContents = document.getElementById('answerContents').value;
        const teacherComment = document.getElementById('teacherComment').value;
        const score = document.getElementById('score').value;

        // Validate input
        if (!answerContents) {
            alert('Please provide an answer');
            return;
        }

        // Prepare answer data
        const answerData = {
            question_id: questionId,
            answer_contents: answerContents,
            teacher_comment: teacherComment || null,
            score: score ? parseFloat(score) : null
        };

        // Submit answer to Supabase
        const { data, error } = await queryDatabase('answer_list', 'insert', answerData);

        if (error) {
            console.error('Error submitting answer:', error);
            alert(`Failed to submit answer: ${error.message}`);
            return;
        }

        // Clear form and hide
        document.getElementById('answerContents').value = '';
        document.getElementById('teacherComment').value = '';
        document.getElementById('score').value = '';
        document.getElementById('answerForm').style.display = 'none';

        alert('Answer submitted successfully!');
    } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Supabase is loaded
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase not loaded');
        alert('Supabase library not found. Please check your script inclusion.');
        return;
    }

    // Perform connection test
    await testSupabaseConnection();

    // Set up random question button
    const getRandomQuestionBtn = document.getElementById('getRandomQuestionBtn');
    if (getRandomQuestionBtn) {
        getRandomQuestionBtn.addEventListener('click', handleRandomQuestionRetrieval);
    }

    // Load initial questions
    loadAllQuestions();
});

// DOM Elements
const randomQuestionBtn = document.getElementById('randomQuestionBtn');
const randomQuestionDisplay = document.getElementById('randomQuestionDisplay');
const questionsTableBody = document.getElementById('questionsTableBody');

// Add connection status display to index.html
function addConnectionStatusDisplay() {
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connectionStatus';
    connectionStatus.style.padding = '10px';
    connectionStatus.style.backgroundColor = '#f0f0f0';
    connectionStatus.style.marginBottom = '20px';
    connectionStatus.textContent = 'Checking Supabase connection...';
    
    const body = document.body;
    body.insertBefore(connectionStatus, body.firstChild);
}

// Call addConnectionStatusDisplay function
addConnectionStatusDisplay();
