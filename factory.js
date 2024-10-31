class VaccinationFactory {
    createVaccination(type, date) {
        switch(type.toLowerCase()) {
            case 'mmr':
                return new MMRVaccination(date);
            case 'dpt':
                return new DPTVaccination(date);
            case 'polio':
                return new PolioVaccination(date);
            default:
                throw new Error('Invalid vaccination type');
        }
    }
}

// Vaccination types
class Vaccination {
    constructor(name, date) {
        this.name = name;
        this.date = date;
        this.nextDueDate = this.calculateNextDueDate(date);
    }

    calculateNextDueDate(date) {
        return new Date(date);
    }
}

class MMRVaccination extends Vaccination {
    constructor(date) {
        super('MMR', date);
    }

    calculateNextDueDate(date) {
        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 6);
        return nextDate;
    }
}

class DPTVaccination extends Vaccination {
    constructor(date) {
        super('DPT', date);
    }

    calculateNextDueDate(date) {
        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 4);
        return nextDate;
    }
}

class PolioVaccination extends Vaccination {
    constructor(date) {
        super('Polio', date);
    }

    calculateNextDueDate(date) {
        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 3);
        return nextDate;
    }
}