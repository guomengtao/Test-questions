// Function to fetch and display Geography questions
async function loadGeographyQuestions() {
    try {
        // Fetch Geography questions (course_id = 3)
        const { data, error } = await queryDatabase('questions', 'select', {
            filter: {
                column: 'course_id',
                value: 3
            }
        });

        if (error) {
            console.error('Error fetching Geography questions:', error);
            return;
        }

        const geographyQuestionsList = document.getElementById('geographyQuestionsList');
        
        if (!geographyQuestionsList) {
            console.warn('Geography questions list container not found');
            return;
        }

        // Clear any existing content
        geographyQuestionsList.innerHTML = '';

        // If no questions found
        if (!data || data.length === 0) {
            geographyQuestionsList.innerHTML = '<p>暂无地理问题</p>';
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

            geographyQuestionsList.appendChild(questionCard);
        });

    } catch (err) {
        console.error('Unexpected error loading Geography questions:', err);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Supabase is loaded and initialized
    await initializeDatabaseConnections();
    
    // Load Geography questions
    await loadGeographyQuestions();
});
