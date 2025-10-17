// index.js
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize seats: 10 seats for simplicity
let seats = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    status: 'available', // available, locked, booked
    lockedBy: null,
    lockExpires: null
}));

// Helper function to release expired locks
function releaseExpiredLocks() {
    const now = Date.now();
    seats.forEach(seat => {
        if (seat.status === 'locked' && seat.lockExpires <= now) {
            seat.status = 'available';
            seat.lockedBy = null;
            seat.lockExpires = null;
        }
    });
}

// GET all seats
app.get('/seats', (req, res) => {
    releaseExpiredLocks();
    res.json(seats);
});

// POST lock a seat
app.post('/seats/:id/lock', (req, res) => {
    releaseExpiredLocks();
    const seatId = parseInt(req.params.id);
    const { user } = req.body;
    const seat = seats.find(s => s.id === seatId);

    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    if (seat.status === 'booked') return res.status(400).json({ error: 'Seat already booked' });
    if (seat.status === 'locked') return res.status(400).json({ error: 'Seat already locked' });

    // Lock seat for 1 minute
    seat.status = 'locked';
    seat.lockedBy = user;
    seat.lockExpires = Date.now() + 60 * 1000;

    res.json({ message: `Seat ${seatId} locked for ${user} for 1 minute` });
});

// POST confirm a seat
app.post('/seats/:id/confirm', (req, res) => {
    releaseExpiredLocks();
    const seatId = parseInt(req.params.id);
    const { user } = req.body;
    const seat = seats.find(s => s.id === seatId);

    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    if (seat.status !== 'locked' || seat.lockedBy !== user) {
        return res.status(400).json({ error: 'Seat is not locked by you or lock expired' });
    }

    // Confirm booking
    seat.status = 'booked';
    seat.lockedBy = null;
    seat.lockExpires = null;

    res.json({ message: `Seat ${seatId} successfully booked by ${user}` });
});

// Auto-release expired locks every 10 seconds
setInterval(releaseExpiredLocks, 10 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Ticket booking system running on http://localhost:${PORT}`);
});