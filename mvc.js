class Child {
    constructor(id, name, dateOfBirth) {
        this.id = id;
        this.name = name;
        this.dateOfBirth = dateOfBirth;
        this.vaccinations = [];
    }

    addVaccination(vaccination) {
        this.vaccinations.push(vaccination);
    }
}

// Model - Data Store
class VaccinationStore {
    constructor() {
        this.children = new Map();
    }

    addChild(child) {
        this.children.set(child.id, child);
    }

    getChild(id) {
        return this.children.get(id);
    }

    getAllChildren() {
        return Array.from(this.children.values());
    }

    updateChild(child) {
        if (this.children.has(child.id)) {
            this.children.set(child.id, child);
            return true;
        }
        return false;
    }
}

// Controller
class VaccinationController {
    constructor() {
        this.store = new VaccinationStore();
        this.view = new VaccinationView();
        this.vaccinationFactory = new VaccinationFactory();
    }

    registerChild(id, name, dateOfBirth) {
        const child = new Child(id, name, dateOfBirth);
        this.store.addChild(child);
        this.view.displayMessage('Child registered successfully');
        this.view.displayChild(child);
    }

    addVaccination(childId, vaccinationType, date) {
        try {
            const child = this.store.getChild(childId);
            if (!child) {
                throw new Error('Child not found');
            }

            const vaccination = this.vaccinationFactory.createVaccination(vaccinationType, date);
            child.addVaccination(vaccination);
            this.store.updateChild(child);
            
            this.view.displayMessage('Vaccination added successfully');
            this.view.displayVaccination(childId, vaccination);
        } catch (error) {
            this.view.displayError(error.message);
        }
    }

    getChildVaccinations(childId) {
        const child = this.store.getChild(childId);
        if (child) {
            this.view.displayVaccinationHistory(child);
        } else {
            this.view.displayError('Child not found');
        }
    }

    getAllChildren() {
        const children = this.store.getAllChildren();
        this.view.displayAllChildren(children);
    }
}

// View
class VaccinationView {
    displayMessage(message) {
        console.log(`Success: ${message}`);
    }

    displayError(error) {
        console.error(`Error: ${error}`);
    }

    displayChild(child) {
        console.log(`
            Child Information:
            ID: ${child.id}
            Name: ${child.name}
            Date of Birth: ${child.dateOfBirth}
        `);
    }

    displayVaccination(childId, vaccination) {
        console.log(`
            Vaccination Added:
            Child ID: ${childId}
            Type: ${vaccination.name}
            Date: ${vaccination.date}
            Next Due Date: ${vaccination.nextDueDate}
        `);
    }

    displayVaccinationHistory(child) {
        console.log(`
            Vaccination History for ${child.name} (ID: ${child.id}):
        `);
        child.vaccinations.forEach((vaccination, index) => {
            console.log(`
                ${index + 1}. Type: ${vaccination.name}
                   Date: ${vaccination.date}
                   Next Due: ${vaccination.nextDueDate}
            `);
        });
    }

    displayAllChildren(children) {
        console.log('All Registered Children:');
        children.forEach(child => {
            console.log(`
                ID: ${child.id}
                Name: ${child.name}
                DOB: ${child.dateOfBirth}
                Total Vaccinations: ${child.vaccinations.length}
            `);
        });
    }
}

// Usage Example
const controller = new VaccinationController();

// Register children
controller.registerChild(1, "John Doe", "2020-01-15");
controller.registerChild(2, "Jane Smith", "2021-03-20");

// Add vaccinations
controller.addVaccination(1, "MMR", "2023-01-15");
controller.addVaccination(1, "DPT", "2023-02-20");
controller.addVaccination(2, "Polio", "2023-04-10");

// Display vaccination history
controller.getChildVaccinations(1);

// Display all children
controller.getAllChildren()