const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseDates() {
  console.log('=== VERIFYING DATABASE TABLES & TIMESTAMPS ===\n');

  const latestReservation = await prisma.reservation.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('📅 Reservation Table (Date & CreatedAt):', latestReservation ? {
    bookingRef: latestReservation.bookingRef,
    reservationDate: latestReservation.date,
    reservationTime: latestReservation.time,
    createdAt: latestReservation.createdAt
  } : 'No records');

  const latestOrder = await prisma.whatsAppOrder.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('📦 WhatsApp Order Table (CreatedAt):', latestOrder ? {
    orderRef: latestOrder.orderRef,
    createdAt: latestOrder.createdAt
  } : 'No records');

  const latestDish = await prisma.dish.findFirst({
    orderBy: { lastModifiedAt: 'desc' }
  });
  console.log('🍲 Dish Table (LastModifiedAt):', latestDish ? {
    name: latestDish.name,
    lastModifiedAt: latestDish.lastModifiedAt
  } : 'No records');

  const latestMessage = await prisma.contactMessage.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('✉️ Contact Message Table (CreatedAt):', latestMessage ? {
    name: latestMessage.name,
    createdAt: latestMessage.createdAt
  } : 'No records');

  const latestSession = await prisma.adminLoginSession.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('🔐 Admin Login Session Table (LoginAt & CreatedAt):', latestSession ? {
    adminEmail: latestSession.adminEmail,
    loginAt: latestSession.loginAt,
    createdAt: latestSession.createdAt
  } : 'No records');
}

checkDatabaseDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
