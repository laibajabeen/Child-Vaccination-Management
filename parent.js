document.getElementById('childRegistrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const parentEmail = document.getElementById('parentEmail').value;
    const childName = document.getElementById('childName').value;
    const dateOfBirth = document.getElementById('childDOB').value;
    const gender = document.getElementById('gender').value;

    // Validate childName: Only alphabets and spaces allowed
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(childName)) {
        alert('Child name must contain only alphabets and spaces.');
        return;
    }

    const selectedVaccines = Array.from(
        document.querySelectorAll('input[name="vaccine"]:checked')
    ).map(el => el.value);

    if (selectedVaccines.length === 0) {
        alert('Please select at least one vaccine');
        return;
    }

    const childData = {
        childName,
        dateOfBirth,
        gender,
        vaccines: selectedVaccines,
        parentEmail
    };

    try {
        const response = await fetch('/register-vaccination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(childData)
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const result = await response.json();
        alert('Child registered successfully!');
        loadVaccinationRecords();
        this.reset();
    } catch (error) {
        alert('Error registering child: ' + error.message);
    }
});
// Load vaccination records
async function loadVaccinationRecords() {
    const parentEmail = document.getElementById('parentEmail').value;

    try {
        const response = await fetch(`/vaccination-records/${parentEmail}`);
        if (!response.ok) {
            throw new Error('Failed to load vaccination records.');
        }

        const records = await response.json();
        const recordsContainer = document.getElementById('vaccinationRecords');
        
        // Clear previous records
        recordsContainer.innerHTML = '';

        // Display the records dynamically
        records.forEach(record => {
            const recordCard = document.createElement('div');
            recordCard.className = 'record-card';

            recordCard.innerHTML = `
                <h3>${record.childName}</h3>
                <p>Date of Birth: ${new Date(record.dateOfBirth).toLocaleDateString()}</p>
                <p>Gender: ${record.gender}</p>
                <p>Vaccines: ${record.vaccines.map(vaccine => vaccine.name).join(', ')}</p>
                <p class="timestamp">Registered on: ${new Date(record.createdAt).toLocaleDateString()}</p>
            `;

            recordsContainer.appendChild(recordCard);
        });
    } catch (error) {
        console.error('Error loading vaccination records:', error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display FAQs
    fetch('/faqs')
        .then(response => response.json())
        .then(data => {
            const faqList = document.getElementById('faqList');
            faqList.innerHTML = ''; // Clear any existing content

            if (data.length > 0) {
                data.forEach(faq => {
                    const faqItem = document.createElement('div');
                    faqItem.classList.add('faq-item');
                    
                    const question = document.createElement('h3');
                    question.textContent = faq.question;
                    
                    const answer = document.createElement('p');
                    answer.textContent = faq.answer;

                    faqItem.appendChild(question);
                    faqItem.appendChild(answer);
                    faqList.appendChild(faqItem);
                });
            } else {
                faqList.innerHTML = '<p>No FAQs available at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching FAQs:', error);
            const faqList = document.getElementById('faqList');
            faqList.innerHTML = '<p>Failed to load FAQs. Please try again later.</p>';
        });
});
