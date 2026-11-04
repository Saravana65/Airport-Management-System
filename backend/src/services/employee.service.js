/**
 * Module 8: Employee & Workforce Management Service
 * Manages airport and airline employees with clear separation between
 * technical system login roles (ADMIN, AIRLINE_STAFF) and operational job titles.
 */

const db = require('./database.service');
const store = require('./operations.store');

async function getAllEmployees(filters = {}) {
    let list = store.employees;

    if (filters.airport) {
        list = list.filter(e => e.airportCode === filters.airport.toUpperCase());
    }
    if (filters.airline) {
        list = list.filter(e => e.airlineCode === filters.airline.toUpperCase());
    }
    if (filters.shift) {
        list = list.filter(e => e.shift === filters.shift.toUpperCase());
    }
    if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(e =>
            e.firstName.toLowerCase().includes(q) ||
            e.lastName.toLowerCase().includes(q) ||
            e.jobTitle.toLowerCase().includes(q)
        );
    }

    return list;
}

async function getEmployeeById(id) {
    const numId = parseInt(id, 10);
    return store.employees.find(e => e.employeeId === numId) || null;
}

async function createEmployee(data) {
    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    const airportCode = (data.airportCode || '').toUpperCase().trim();
    const jobTitle = (data.jobTitle || '').trim();

    if (!firstName || !lastName || !airportCode || !jobTitle) {
        const err = new Error('First name, last name, airport code, and job title are required.');
        err.statusCode = 400;
        throw err;
    }

    const newEmployee = {
        employeeId: store.employees.length + 1,
        userId: data.userId || (store.employees.length + 10),
        airportCode,
        airlineCode: data.airlineCode ? data.airlineCode.toUpperCase().trim() : null,
        firstName,
        lastName,
        jobTitle, // Operational role (e.g. 'Ramp Marshaller', 'Baggage Dispatch Lead')
        shift: data.shift ? data.shift.toUpperCase() : 'DAY',
        contactPhone: data.contactPhone || null,
        isActive: 'Y',
        createdAt: new Date().toISOString(),
    };

    store.employees.push(newEmployee);
    return newEmployee;
}

async function updateEmployee(id, data) {
    const employee = await getEmployeeById(id);
    if (!employee) {
        const err = new Error('Employee record not found.');
        err.statusCode = 404;
        throw err;
    }

    if (data.firstName) employee.firstName = data.firstName;
    if (data.lastName) employee.lastName = data.lastName;
    if (data.jobTitle) employee.jobTitle = data.jobTitle;
    if (data.shift) employee.shift = data.shift.toUpperCase();
    if (data.contactPhone) employee.contactPhone = data.contactPhone;
    if (data.isActive !== undefined) employee.isActive = data.isActive;

    return employee;
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
};
