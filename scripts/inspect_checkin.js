const db = require('../backend/src/services/database.service');

async function inspect() {
    const chk = await db.execute('SELECT * FROM CHECK_IN LIMIT 5');
    console.log('CHECK_IN sample:', chk.rows);
    const t = await db.execute("SELECT TICKET_ID, BOOKING_ID, SEAT_NUMBER, STATUS FROM TICKETS WHERE STATUS = 'CHECKED_IN' LIMIT 5");
    console.log('CHECKED_IN TICKETS sample:', t.rows);
    const countRes = await db.execute(`
        SELECT fi.FLIGHT_NUMBER, COUNT(c.CHECK_IN_ID) as checkedInCount, COUNT(t.TICKET_ID) as totalTickets
        FROM FLIGHT_INSTANCES fi
        LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID AND t.STATUS != 'CANCELLED'
        LEFT JOIN CHECK_IN c ON t.TICKET_ID = c.TICKET_ID
        GROUP BY fi.FLIGHT_INSTANCE_ID, fi.FLIGHT_NUMBER
    `);
    console.log('Flight check-in counts:', countRes.rows);
    process.exit(0);
}
inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
