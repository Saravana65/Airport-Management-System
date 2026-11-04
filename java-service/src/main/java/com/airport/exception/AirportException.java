package com.airport.exception;

/**
 * Base exception for all Airport Domain business logic errors.
 */
public class AirportException extends RuntimeException {
    private final String errorCode;

    public AirportException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AirportException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
