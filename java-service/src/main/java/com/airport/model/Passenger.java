package com.airport.model;

import java.util.Objects;

/**
 * Passenger entity demonstrating Encapsulation.
 */
public class Passenger {
    private final String passengerId;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String passportNumber;

    public Passenger(String passengerId, String firstName, String lastName, String email, String passportNumber) {
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new IllegalArgumentException("First name cannot be null or empty");
        }
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new IllegalArgumentException("Last name cannot be null or empty");
        }
        this.passengerId = passengerId != null ? passengerId : "PA-" + System.currentTimeMillis();
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.email = email != null ? email.trim() : "";
        this.passportNumber = passportNumber != null ? passportNumber.trim() : "";
    }

    public String getPassengerId() {
        return passengerId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassportNumber() {
        return passportNumber;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Passenger that)) return false;
        return Objects.equals(passengerId, that.passengerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(passengerId);
    }

    @Override
    public String toString() {
        return "Passenger{" +
                "id='" + passengerId + '\'' +
                ", name='" + getFullName() + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
