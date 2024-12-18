// Function to fetch and display Politics questions
async function loadPoliticsQuestions() {
    try {
        // Fetch Politics questions (course_id = 4)
        const { data, error } = await queryDatabase('questions', 'select', {
            filter: {
                column: 'course_id',
                value: 4
            }
        });

        if (error) {
            console.error('Error fetching Politics questions:', error);
            return;
        }

        const politicsQuestionsList = document.getElementById('politicsQuestionsList');
        
        if (!politicsQuestionsList) {
            console.warn('Politics questions list container not found');
            return;
        }

        // Clear any existing content
        politicsQuestionsList.innerHTML = '';

        // If no questions found
        if (!data || data.length === 0) {
            politicsQuestionsList.innerHTML = '<p>暂无政治问题</p>';
            return;
        }

        // Create and append question cards
        data.forEach(question => {
            const questionCard = document.createElement('div');
            questionCard.classList.add('question-card');
            
            // Get total answers for this question
            const totalAnswersPromise = getTotalAnswersForQuestion(question.id);
            
            totalAnswersPromise.then(totalAnswers => {
                questionCard.innerHTML = `
                    <h3>${question.question}</h3>
                    <div class="question-meta">
                        <span class="answers-count">答案数: ${totalAnswers}</span>
                        <button onclick="viewQuestionDetails(${question.id})">查看详情</button>
                    </div>
                `;
            });

            politicsQuestionsList.appendChild(questionCard);
        });

    } catch (err) {
        console.error('Unexpected error loading Politics questions:', err);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Supabase is loaded and initialized
    await initializeDatabaseConnections();
    
    // Load Politics questions
    await loadPoliticsQuestions();
});
