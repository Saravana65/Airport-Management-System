package com.airport.integration;

import com.airport.model.Booking;
import com.airport.model.CommercialBooking;
import com.airport.model.VipBooking;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lightweight JSON formatting and simple parsing without third-party dependencies.
 * Perfect for standard Java SE environment.
 */
public class JsonHelper {

    public static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public static String bookingToJson(Booking b) {
        if (b == null) return "null";

        StringBuilder sb = new StringBuilder("{");
        sb.append("\"bookingId\":\"").append(escapeJson(b.getBookingId())).append("\",");
        sb.append("\"bookingReference\":\"").append(escapeJson(b.getBookingReference())).append("\",");
        sb.append("\"bookingType\":\"").append(escapeJson(b.getBookingType())).append("\",");
        sb.append("\"status\":\"").append(b.getStatus().name()).append("\",");
        sb.append("\"serviceFee\":").append(b.calculateServiceFee()).append(",");
        sb.append("\"totalAmount\":").append(b.getTotalAmount()).append(",");

        // Passenger sub-object
        sb.append("\"passenger\":{");
        sb.append("\"id\":\"").append(escapeJson(b.getPassenger().getPassengerId())).append("\",");
        sb.append("\"name\":\"").append(escapeJson(b.getPassenger().getFullName())).append("\",");
        sb.append("\"email\":\"").append(escapeJson(b.getPassenger().getEmail())).append("\",");
        sb.append("\"passport\":\"").append(escapeJson(b.getPassenger().getPassportNumber())).append("\"");
        sb.append("},");

        // Flight sub-object
        sb.append("\"flight\":{");
        sb.append("\"flightNumber\":\"").append(escapeJson(b.getFlight().getFlightNumber())).append("\",");
        sb.append("\"origin\":\"").append(escapeJson(b.getFlight().getOrigin())).append("\",");
        sb.append("\"destination\":\"").append(escapeJson(b.getFlight().getDestination())).append("\",");
        sb.append("\"baseFare\":").append(b.getFlight().getBaseFare()).append(",");
        sb.append("\"bookedSeats\":").append(b.getFlight().getBookedSeats()).append(",");
        sb.append("\"totalCapacity\":").append(b.getFlight().getTotalCapacity());
        sb.append("},");

        // Ticket sub-object
        if (b.getTicket() != null) {
            sb.append("\"ticket\":{");
            sb.append("\"ticketNumber\":\"").append(escapeJson(b.getTicket().getTicketNumber())).append("\",");
            sb.append("\"seatNumber\":\"").append(escapeJson(b.getTicket().getSeatNumber())).append("\",");
            sb.append("\"cabinClass\":\"").append(b.getTicket().getCabinClass().name()).append("\",");
            sb.append("\"price\":").append(b.getTicket().getPrice());
            sb.append("},");
        } else {
            sb.append("\"ticket\":null,");
        }

        // Subclass specific fields
        if (b instanceof CommercialBooking cb) {
            sb.append("\"frequentFlyer\":").append(cb.isFrequentFlyerMember());
        } else if (b instanceof VipBooking vb) {
            sb.append("\"loungeId\":\"").append(escapeJson(vb.getDedicatedLoungeId())).append("\",");
            sb.append("\"fastTrack\":").append(vb.isFastTrackSecurityEnabled());
        } else {
            sb.append("\"custom\":true");
        }

        sb.append("}");
        return sb.toString();
    }

    public static String bookingListToJson(List<Booking> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append(bookingToJson(list.get(i)));
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    public static String errorJson(String errorCode, String message) {
        return String.format("{\"error\":true,\"errorCode\":\"%s\",\"message\":\"%s\"}",
                escapeJson(errorCode), escapeJson(message));
    }

    public static String extractJsonField(String json, String field) {
        if (json == null || field == null) return null;
        Pattern p = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);

        Pattern pNum = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*([0-9.]+|true|false)");
        Matcher mNum = pNum.matcher(json);
        if (mNum.find()) return mNum.group(1);

        return null;
    }
}
