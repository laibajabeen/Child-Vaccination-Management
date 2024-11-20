// vaccinationManager.js
class VaccinationManager {
    constructor() {
        if (VaccinationManager.instance) {
            return VaccinationManager.instance;
        }
        
        // Initialize the manager state
        this.vaccineSchedules = new Map();
        this.vaccinationRecords = new Map();
        this.observers = [];
        
        VaccinationManager.instance = this;
    }

    // Vaccination Record Management
    addVaccinationRecord(childId, record) {
        this.vaccinationRecords.set(childId, record);
        this.notifyObservers('recordAdded', { childId, record });
    }

    getVaccinationRecord(childId) {
        return this.vaccinationRecords.get(childId);
    }

    // Schedule Management
    addVaccineSchedule(childId, schedule) {
        this.vaccineSchedules.set(childId, schedule);
        this.notifyObservers('scheduleAdded', { childId, schedule });
    }

    getVaccineSchedule(childId) {
        return this.vaccineSchedules.get(childId);
    }

    // Observer Pattern Methods
    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => observer.update(event, data));
    }
}

// Create and export the singleton instance
const vaccinationManager = new VaccinationManager();
Object.freeze(vaccinationManager);

export default vaccinationManager;