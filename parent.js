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
// Add this to your frontend JavaScript code

// Function to populate the form with existing data
function populateFormForEdit(record) {
    document.getElementById('childName').value = record.childName;
    document.getElementById('childDOB').value = record.dateOfBirth.split('T')[0];
    document.getElementById('gender').value = record.gender;
    document.getElementById('parentEmail').value = record.parentEmail;
    
    // Reset all checkboxes first
    document.querySelectorAll('input[name="vaccine"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check the boxes for existing vaccines
    record.vaccines.forEach(vaccine => {
        const checkbox = document.querySelector(`input[value="${vaccine.name}"]`);
        if (checkbox) checkbox.checked = true;
    });
    
    // Change form submit button and add record ID
    const form = document.getElementById('childRegistrationForm');
    form.dataset.recordId = record._id;
    form.querySelector('button[type="submit"]').textContent = 'Update Record';
}

// Modify the record card creation in loadVaccinationRecords
function createRecordCard(record) {
    const recordCard = document.createElement('div');
    recordCard.className = 'record-card';
    
    recordCard.innerHTML = `
        <h3>${record.childName}</h3>
        <p>Date of Birth: ${new Date(record.dateOfBirth).toLocaleDateString()}</p>
        <p>Gender: ${record.gender}</p>
        <p>Vaccines: ${record.vaccines.map(vaccine => vaccine.name).join(', ')}</p>
        <p class="timestamp">Registered on: ${new Date(record.createdAt).toLocaleDateString()}</p>
        <div class="record-actions">
            <button class="edit-btn" onclick="editRecord('${record._id}')">Edit</button>
            <button class="delete-btn" onclick="deleteRecord('${record._id}')">Delete</button>
        </div>
    `;
    
    return recordCard;
}

// Function to fetch and edit a record
async function editRecord(recordId) {
    try {
        const response = await fetch(`/register-vaccination/${recordId}`);
        if (!response.ok) throw new Error('Failed to fetch record');
        
        const record = await response.json();
        populateFormForEdit(record.data);
        
        // Scroll to form
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Error loading record: ' + error.message);
    }
}

// Function to delete a record
async function deleteRecord(recordId) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
        const response = await fetch(`/register-vaccination/${recordId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete record');
        
        await loadVaccinationRecords(); // Refresh the list
        alert('Record deleted successfully');
    } catch (error) {
        alert('Error deleting record: ' + error.message);
    }
}

// Modify the form submission handler to handle both creation and updates
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

    const recordId = this.dataset.recordId;
    const isUpdate = !!recordId;

    try {
        const response = await fetch(isUpdate ? `/register-vaccination/${recordId}` : '/register-vaccination', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(childData)
        });

        if (!response.ok) {
            throw new Error(isUpdate ? 'Update failed' : 'Registration failed');
        }

        const result = await response.json();
        alert(isUpdate ? 'Record updated successfully!' : 'Child registered successfully!');
        
        // Reset form and button
        this.reset();
        this.dataset.recordId = '';
        this.querySelector('button[type="submit"]').textContent = 'Register Child';
        
        loadVaccinationRecords();
    } catch (error) {
        alert(`Error ${isUpdate ? 'updating' : 'registering'} child: ${error.message}`);
    }
});