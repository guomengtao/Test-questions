// Supabase Configuration
const SUPABASE_URL = 'https://tkcrnfgnspvtzwbbvyfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simplified Supabase connection and authentication
async function testSupabaseConnection() {
    try {
        console.log('🔍 Testing Supabase Connection...');

        // Direct query using anonymous key
        const { data, error } = await supabase
            .from('questions')
            .select('id, question')
            .limit(1);

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
                    <p>URL: ${SUPABASE_URL}</p>
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

// Load and display questions for management
async function loadQuestionsForManagement() {
    try {
        // Fetch questions with their answer count using a separate query
        const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select(`
                id,
                question,
                courser,
                data
            `)
            .order('created_at', { ascending: false });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            displayErrorMessage('Failed to load questions');
            return;
        }

        // Clear existing questions list
        const questionsList = document.getElementById('questionsList');
        if (!questionsList) {
            console.error('Questions list container not found');
            return;
        }
        questionsList.innerHTML = '';

        // Check if no questions exist
        if (!questionsData || questionsData.length === 0) {
            questionsList.innerHTML = '<p>No questions found. Add a new question!</p>';
            return;
        }

        // Process and display each question with answer count
        for (const question of questionsData) {
            // Count total answers for this specific question
            const { count: totalAnswers, error: answersError } = await supabase
                .from('answer_list')
                .select('id', { count: 'exact' })
                .eq('question_id', question.id);

            if (answersError) {
                console.error(`Error counting answers for question ${question.id}:`, answersError);
                continue;
            }

            // Create question card
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.innerHTML = `
                <div class="question-header">
                    <h3>${escapeHTML(question.question)}</h3>
                    <div class="question-meta">
                        <span class="courser">${escapeHTML(question.courser || 'No Courser')}</span>
                        <span class="total-answers">Total Answers: ${totalAnswers || 0}</span>
                    </div>
                </div>
                <div class="question-actions">
                    <button onclick="openEditQuestionModal(${question.id}, '${escapeHTML(question.question)}', '${escapeHTML(question.courser || '')}', '${escapeHTML(question.data || '')}')" class="edit-btn">Edit</button>
                    <button onclick="deleteQuestion(${question.id})" class="delete-btn">Delete</button>
                </div>
            `;

            // Append question card to the list
            questionsList.appendChild(questionCard);
        }

        console.log(`Loaded ${questionsData.length} questions`);
    } catch (err) {
        console.error('Unexpected error in loadQuestionsForManagement:', err);
        displayErrorMessage('An unexpected error occurred while loading questions');
    }
}

// Add new question
async function addNewQuestion() {
    try {
        const questionInput = document.getElementById('questionInput');
        const courserInput = document.getElementById('courserInput');
        const additionalDataInput = document.getElementById('additionalDataInput');

        const question = questionInput.value.trim();
        const courser = courserInput.value.trim();
        const additionalData = additionalDataInput.value.trim();

        if (!question) {
            displayErrorMessage('Question is required');
            return;
        }

        // Prepare data object with structured data
        const questionData = {
            question: question,
            courser: courser || null,
            data: additionalData ? JSON.stringify({ additionalInfo: additionalData }) : null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('questions')
            .insert(questionData)
            .select();

        if (error) {
            console.error('Error adding question:', error);
            
            // More detailed error handling
            let errorMessage = 'Failed to add question';
            if (error.code === '42501') {
                errorMessage += '. Permission denied. Check your authentication.';
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }

            displayErrorMessage(errorMessage);
            return;
        }

        // Clear input fields
        questionInput.value = '';
        courserInput.value = '';
        additionalDataInput.value = '';

        // Reload questions
        await loadQuestionsForManagement();

        displaySuccessMessage('Question added successfully!');
    } catch (err) {
        console.error('Unexpected error adding question:', err);
        displayErrorMessage('An unexpected error occurred');
    }
}

// Open edit modal for a specific question
function openEditModal(questionId, currentQuestion, currentCourser, currentData) {
    console.log('Opening edit modal with details:', {
        questionId, 
        currentQuestion, 
        currentCourser, 
        currentData
    });

    // Get modal elements
    const editQuestionModal = document.getElementById('editQuestionModal');
    const editQuestionIdInput = document.getElementById('editQuestionId');
    const editQuestionInput = document.getElementById('editQuestionInput');
    const editCourserInput = document.getElementById('editCourserInput');
    const editAdditionalDataInput = document.getElementById('editAdditionalDataInput');

    // Validate all required elements exist
    if (!editQuestionModal || !editQuestionIdInput || !editQuestionInput || 
        !editCourserInput || !editAdditionalDataInput) {
        console.error('One or more edit modal elements not found', {
            editQuestionModal: !!editQuestionModal,
            editQuestionIdInput: !!editQuestionIdInput,
            editQuestionInput: !!editQuestionInput,
            editCourserInput: !!editCourserInput,
            editAdditionalDataInput: !!editAdditionalDataInput
        });
        displayErrorMessage('Error preparing edit modal. Please try again.');
        return;
    }

    // Clear any previous errors
    clearEditModalError();

    // Set input values
    editQuestionIdInput.value = questionId;
    editQuestionInput.value = currentQuestion || '';
    editCourserInput.value = currentCourser === 'N/A' || currentCourser === 'null' ? '' : (currentCourser || '');

    // Handle additional data parsing
    let additionalData = '';
    try {
        // Handle different possible input formats
        if (currentData && 
            currentData !== 'null' && 
            currentData !== 'No additional data') {
            // If it's a string, try parsing
            if (typeof currentData === 'string') {
                try {
                    const parsedData = JSON.parse(currentData);
                    // If it's an object with additionalInfo, use that
                    if (parsedData && typeof parsedData === 'object') {
                        // Check for different possible structures
                        additionalData = parsedData.additionalInfo || 
                                         JSON.stringify(parsedData) || 
                                         '';
                    } else {
                        additionalData = currentData;
                    }
                } catch {
                    // If parsing fails, use as-is
                    additionalData = currentData;
                }
            } 
            // If it's already an object
            else if (typeof currentData === 'object') {
                // Try to stringify or extract additionalInfo
                additionalData = currentData.additionalInfo ? 
                    JSON.stringify(currentData.additionalInfo) : 
                    JSON.stringify(currentData);
            }
        }
    } catch (err) {
        console.warn('Error parsing additional data:', err);
        additionalData = '';
    }

    // Set additional data input
    editAdditionalDataInput.value = additionalData || '';

    // Show the modal
    editQuestionModal.style.display = 'block';
}

// Function to display error in edit modal
function displayEditModalError(message) {
    const errorContainer = document.getElementById('editModalErrorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = message ? 'block' : 'none';
    } else {
        console.error('Error container not found:', message);
    }
}

// Function to clear error in edit modal
function clearEditModalError() {
    const errorContainer = document.getElementById('editModalErrorContainer');
    if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
    }
}

// Save edited question
async function saveEditedQuestion(event) {
    // Prevent default form submission
    if (event) {
        event.preventDefault();
    }

    // Clear any previous errors
    clearEditModalError();

    const questionId = document.getElementById('editQuestionId').value;
    const editedQuestion = document.getElementById('editQuestionInput').value.trim();
    const editedCourser = document.getElementById('editCourserInput').value.trim();
    const editedAdditionalData = document.getElementById('editAdditionalDataInput').value.trim();

    console.log('Edit form values:', {
        questionId,
        editedQuestion,
        editedCourser,
        editedAdditionalData
    });

    if (!editedQuestion) {
        displayEditModalError('Question is required');
        return;
    }

    // Validate questionId
    if (!questionId) {
        displayEditModalError('Question ID is missing. Cannot update.');
        return;
    }

    // Prepare updated data object with structured data
    const updatedQuestionData = {
        id: questionId,
        question: editedQuestion,
        courser: editedCourser || null,
        updated_at: new Date().toISOString() // Force update timestamp
    };

    // Handle additional data carefully
    try {
        // Only add data if there's meaningful additional data
        if (editedAdditionalData && 
            editedAdditionalData !== 'No additional data' && 
            editedAdditionalData !== 'null') {
            // Try to parse as JSON first
            try {
                const parsedData = JSON.parse(editedAdditionalData);
                updatedQuestionData.data = JSON.stringify(parsedData);
            } catch {
                // If not JSON, create a simple object
                updatedQuestionData.data = JSON.stringify({ 
                    additionalInfo: editedAdditionalData 
                });
            }
        } else {
            // Explicitly set data to null if no meaningful data
            updatedQuestionData.data = null;
        }
    } catch (dataErr) {
        console.warn('Error processing additional data:', dataErr);
        updatedQuestionData.data = null;
    }

    console.log('Updating question with data:', updatedQuestionData);

    // Perform the update with explicit upsert
    const { data, error } = await supabase
        .from('questions')
        .update(updatedQuestionData)
        .eq('id', questionId);

    console.log('Update response:', { data, error });

    if (error) {
        console.error('Error updating question:', error);
        displayEditModalError(`Update failed: ${error.message}`);
        return;
    }

    // Fetch the record again to verify
    const { data: updatedRecord, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

    console.log('Fetched updated record:', updatedRecord);

    if (fetchError) {
        console.error('Error fetching updated record:', fetchError);
        displayEditModalError(`Failed to verify update: ${fetchError.message}`);
        return;
    }

    // Verify the update
    if (!updatedRecord) {
        displayEditModalError('Question update failed. No updated record found.');
        return;
    }

    // Detailed comparison of update
    const updateChanges = Object.keys(updatedQuestionData).reduce((changes, key) => {
        const existingValue = JSON.stringify(updatedRecord[key]);
        const newValue = JSON.stringify(updatedQuestionData[key]);
        
        if (existingValue !== newValue) {
            changes[key] = {
                from: updatedRecord[key],
                to: updatedQuestionData[key]
            };
        }
        return changes;
    }, {});

    console.log('Confirmed update changes:', updateChanges);

    // Close modal
    const editQuestionModal = document.getElementById('editQuestionModal');
    editQuestionModal.style.display = 'none';

    // Reload questions to reflect the changes
    await loadQuestionsForManagement();

    displaySuccessMessage('Question updated successfully!');
}

// Delete question
async function deleteQuestion(questionId) {
    try {
        // Confirm deletion
        const confirmDelete = confirm('Are you sure you want to delete this question? This will also delete all associated answers.');

        if (!confirmDelete) return;

        // First, delete associated answers
        const { error: answersDeleteError } = await supabase
            .from('answer_list')
            .delete()
            .eq('question_id', questionId);

        if (answersDeleteError) {
            console.error('Error deleting associated answers:', answersDeleteError);
            displayErrorMessage(`Failed to delete associated answers: ${answersDeleteError.message}`);
            return;
        }

        // Then delete the question
        const { data, error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId);

        if (error) {
            console.error('Error deleting question:', error);
            displayErrorMessage(`Failed to delete question: ${error.message}`);
            return;
        }

        // Reload questions
        await loadQuestionsForManagement();

        displaySuccessMessage('Question deleted successfully!');
    } catch (err) {
        console.error('Unexpected error deleting question:', err);
        displayErrorMessage('An unexpected error occurred');
    }
}

// Utility functions for displaying messages
function displayErrorMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

function displaySuccessMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div class="success-message">
                <p>${message}</p>
            </div>
        `;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

// Close edit modal
function closeEditModal() {
    const editQuestionModal = document.getElementById('editQuestionModal');
    editQuestionModal.style.display = 'none';
}

// Authentication Management
let currentUser = null;

// Initialize authentication state
async function initializeAuthentication() {
    try {
        // Check current authentication state
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.email);
            updateAuthUI(true);
        } else {
            console.log('❌ No user authenticated');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Authentication initialization error:', error);
        updateAuthUI(false);
    }
}

// Update UI based on authentication state
function updateAuthUI(isAuthenticated) {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const editButtons = document.querySelectorAll('.edit-question-btn');
    const authStatus = document.getElementById('authStatus');

    if (isAuthenticated) {
        if (loginButton) loginButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'block';
        if (authStatus) authStatus.textContent = `Logged in as: ${currentUser.email}`;
        
        // Enable edit buttons
        editButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    } else {
        if (loginButton) loginButton.style.display = 'block';
        if (logoutButton) logoutButton.style.display = 'none';
        if (authStatus) authStatus.textContent = 'Not logged in';
        
        // Disable edit buttons
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }
}

// Login function
async function loginWithEmail() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorContainer = document.getElementById('loginError');

    if (!emailInput || !passwordInput) {
        console.error('Login inputs not found');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorContainer.textContent = 'Please enter both email and password';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            errorContainer.textContent = error.message || 'Login failed';
            return;
        }

        if (data.user) {
            currentUser = data.user;
            console.log('✅ Login successful:', currentUser.email);
            updateAuthUI(true);
            
            // Close login modal
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.style.display = 'none';
        }
    } catch (err) {
        console.error('Unexpected login error:', err);
        errorContainer.textContent = 'An unexpected error occurred';
    }
}

// Logout function
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            return;
        }

        currentUser = null;
        updateAuthUI(false);
        console.log('✅ Logged out successfully');
    } catch (err) {
        console.error('Unexpected logout error:', err);
    }
}

// User Registration Function
async function registerUser() {
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerErrorContainer = document.getElementById('registerError');

    // Clear previous error
    if (registerErrorContainer) registerErrorContainer.textContent = '';

    // Validate inputs
    if (!emailInput || !passwordInput || !confirmPasswordInput) {
        console.error('Registration inputs not found');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validate email
    if (!email || !email.includes('@')) {
        registerErrorContainer.textContent = 'Please enter a valid email address';
        return;
    }

    // Validate password
    if (password.length < 6) {
        registerErrorContainer.textContent = 'Password must be at least 6 characters long';
        return;
    }

    if (password !== confirmPassword) {
        registerErrorContainer.textContent = 'Passwords do not match';
        return;
    }

    try {
        // Attempt to register the user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error('Registration error:', error);
            registerErrorContainer.textContent = error.message || 'Registration failed';
            return;
        }

        if (data.user) {
            console.log('✅ User registered successfully:', data.user.email);
            
            // Optionally, automatically sign in the user
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) {
                console.error('Auto-login error:', signInError);
            }

            // Close registration modal
            const registrationModal = document.getElementById('registrationModal');
            if (registrationModal) registrationModal.style.display = 'none';

            // Update UI
            updateAuthUI(true);

            // Display success message
            displaySuccessMessage('Registration successful! You are now logged in.');
        }
    } catch (err) {
        console.error('Unexpected registration error:', err);
        registerErrorContainer.textContent = 'An unexpected error occurred during registration';
    }
}

// Add event listeners for authentication
document.addEventListener('DOMContentLoaded', () => {
    // Login button event listener
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.style.display = 'block';
        });
    }

    // Submit login form event listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginWithEmail();
        });
    }

    // Logout button event listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // Initialize authentication on page load
    initializeAuthentication();
});

// Add event listeners for registration
document.addEventListener('DOMContentLoaded', () => {
    // Registration form event listener
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerUser();
        });
    }

    // Open registration modal button
    const openRegistrationModalBtn = document.getElementById('openRegistrationModal');
    if (openRegistrationModalBtn) {
        openRegistrationModalBtn.addEventListener('click', () => {
            const registrationModal = document.getElementById('registrationModal');
            if (registrationModal) registrationModal.style.display = 'block';
        });
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Supabase is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase not loaded');
        alert('Supabase library not found. Please check your script inclusion.');
        return;
    }

    // Perform connection test
    await testSupabaseConnection();

    // Load initial questions
    await loadQuestionsForManagement();

    // Set up form submission listeners
    const addQuestionForm = document.getElementById('addQuestionForm');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addNewQuestion();
        });
    }

    // Edit question form listener
    const editQuestionForm = document.getElementById('editQuestionForm');
    if (editQuestionForm) {
        console.log('Setting up edit question form listener');
        editQuestionForm.addEventListener('submit', saveEditedQuestion);
    } else {
        console.error('Edit question form not found');
    }

    // Set up close modal button
    const closeModalBtn = document.getElementById('closeEditModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    }
});

// Utility function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
}

// Function to escape HTML
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
}

// Function to add a new course
async function addCourse() {
    const courseNameInput = document.getElementById('courseNameInput');
    const courseCodeInput = document.getElementById('courseCodeInput');
    const courseDepartmentInput = document.getElementById('courseDepartmentInput');
    const courseInstructorInput = document.getElementById('courseInstructorInput');
    const courseSemesterInput = document.getElementById('courseSemesterInput');
    const courseYearInput = document.getElementById('courseYearInput');
    const courseDescriptionInput = document.getElementById('courseDescriptionInput');
    const courseErrorContainer = document.getElementById('courseError');

    // Clear previous error
    if (courseErrorContainer) courseErrorContainer.textContent = '';

    // Validate inputs
    const courseName = courseNameInput.value.trim();
    const courseCode = courseCodeInput.value.trim();

    if (!courseName) {
        courseErrorContainer.textContent = 'Course name is required';
        return;
    }

    if (!courseCode) {
        courseErrorContainer.textContent = 'Course code is required';
        return;
    }

    try {
        // Prepare course data
        const courseData = {
            name: courseName,
            code: courseCode,
            department: courseDepartmentInput.value.trim() || null,
            instructor: courseInstructorInput.value.trim() || null,
            semester: courseSemesterInput.value.trim() || null,
            year: courseYearInput.value ? parseInt(courseYearInput.value) : null,
            description: courseDescriptionInput.value.trim() || null
        };

        // Insert course into Supabase
        const { data, error } = await supabase
            .from('courses')
            .insert(courseData)
            .select();

        if (error) {
            console.error('Error adding course:', error);
            courseErrorContainer.textContent = error.message || 'Failed to add course';
            return;
        }

        // Clear input fields
        courseNameInput.value = '';
        courseCodeInput.value = '';
        courseDepartmentInput.value = '';
        courseInstructorInput.value = '';
        courseSemesterInput.value = '';
        courseYearInput.value = '';
        courseDescriptionInput.value = '';

        // Refresh course list
        await loadCourses();

        // Display success message
        displaySuccessMessage('Course added successfully!');
    } catch (err) {
        console.error('Unexpected error adding course:', err);
        courseErrorContainer.textContent = 'An unexpected error occurred';
    }
}

// Function to load courses
async function loadCourses() {
    try {
        // Fetch courses with their statistics
        const { data: coursesData, error } = await supabase
            .rpc('get_courses_with_stats');

        if (error) {
            console.error('Error fetching courses:', error);
            displayErrorMessage('Failed to load courses');
            return;
        }

        // Clear existing courses list
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) {
            console.error('Courses list container not found');
            return;
        }
        coursesList.innerHTML = '';

        // Check if no courses exist
        if (!coursesData || coursesData.length === 0) {
            coursesList.innerHTML = '<p>No courses found. Add a new course!</p>';
            return;
        }

        // Populate courses list
        coursesData.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <div class="course-header">
                    <h3>${escapeHTML(course.course_name)}</h3>
                    <span class="course-code">${escapeHTML(course.course_code)}</span>
                </div>
                <div class="course-stats">
                    <span>Total Questions: ${course.total_questions}</span>
                    <span>Total Answers: ${course.total_answers}</span>
                </div>
                <div class="course-actions">
                    <button onclick="editCourse(${course.course_id})" class="edit-btn">Edit</button>
                    <button onclick="deleteCourse(${course.course_id})" class="delete-btn">Delete</button>
                </div>
            `;

            coursesList.appendChild(courseCard);
        });

        console.log(`Loaded ${coursesData.length} courses`);
    } catch (err) {
        console.error('Unexpected error in loadCourses:', err);
        displayErrorMessage('An unexpected error occurred while loading courses');
    }
}

// Function to populate course dropdown in question form
async function populateCourseDropdown() {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, name, code');

        if (error) {
            console.error('Error fetching courses for dropdown:', error);
            return;
        }

        const courseDropdown = document.getElementById('courseDropdown');
        if (!courseDropdown) return;

        // Clear existing options
        courseDropdown.innerHTML = '<option value="">Select a Course</option>';

        // Populate dropdown
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.code})`;
            courseDropdown.appendChild(option);
        });
    } catch (err) {
        console.error('Unexpected error populating course dropdown:', err);
    }
}

// Event Listeners for Course Management
document.addEventListener('DOMContentLoaded', () => {
    // Add course form submission
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addCourse();
        });
    }

    // Load courses when page loads
    loadCourses();

    // Populate course dropdown
    populateCourseDropdown();
});
