import { PrismaClient, Role, AssetStatus, BookingStatus, AssetCondition, AuditAction, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@iitroorkee.ac.in' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@iitroorkee.ac.in',
      password: adminPassword,
      role: Role.ADMIN,
      department: 'Cultural Council',
      phone: '+91-9876543210',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'rahul.sharma@iitr.ac.in' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@iitr.ac.in',
      password: userPassword,
      role: Role.USER,
      department: 'Computer Science',
      phone: '+91-9123456789',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'priya.patel@iitr.ac.in' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'priya.patel@iitr.ac.in',
      password: userPassword,
      role: Role.USER,
      department: 'Electronics',
      phone: '+91-9234567890',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'arjun.singh@iitr.ac.in' },
    update: {},
    create: {
      name: 'Arjun Singh',
      email: 'arjun.singh@iitr.ac.in',
      password: userPassword,
      role: Role.USER,
      department: 'Mechanical',
    },
  });

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Photography' },
      update: {},
      create: { name: 'Photography', description: 'Cameras and photography equipment', color: '#3B82F6', icon: 'camera' },
    }),
    prisma.category.upsert({
      where: { name: 'Audio Equipment' },
      update: {},
      create: { name: 'Audio Equipment', description: 'Microphones, speakers, mixers', color: '#8B5CF6', icon: 'music' },
    }),
    prisma.category.upsert({
      where: { name: 'Lighting' },
      update: {},
      create: { name: 'Lighting', description: 'Studio and stage lighting equipment', color: '#F59E0B', icon: 'sun' },
    }),
    prisma.category.upsert({
      where: { name: 'Costumes & Props' },
      update: {},
      create: { name: 'Costumes & Props', description: 'Stage costumes and theatrical props', color: '#EC4899', icon: 'shirt' },
    }),
    prisma.category.upsert({
      where: { name: 'Recording' },
      update: {},
      create: { name: 'Recording', description: 'Video and audio recording equipment', color: '#10B981', icon: 'video' },
    }),
    prisma.category.upsert({
      where: { name: 'Event Infrastructure' },
      update: {},
      create: { name: 'Event Infrastructure', description: 'Stages, tents, and event setups', color: '#F97316', icon: 'building' },
    }),
  ]);

  const [photography, audio, lighting, costumes, recording, infrastructure] = categories;

  // Create Assets
  const assets = await Promise.all([
    // Photography
    prisma.asset.create({
      data: {
        name: 'Canon EOS 5D Mark IV',
        description: 'Professional full-frame DSLR camera, 30.4MP',
        categoryId: photography.id,
        totalQuantity: 3,
        availableQuantity: 2,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.EXCELLENT,
        location: 'Media Room 101',
        serialNumber: 'CAM-001',
        purchaseDate: new Date('2022-06-15'),
        warrantyExpiry: new Date('2025-06-15'),
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Nikon D850',
        description: 'Professional DSLR, 45.7MP with 4K video',
        categoryId: photography.id,
        totalQuantity: 2,
        availableQuantity: 2,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Media Room 101',
        serialNumber: 'CAM-002',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Sony Alpha A7 III',
        description: 'Mirrorless full-frame camera, 24.2MP',
        categoryId: photography.id,
        totalQuantity: 2,
        availableQuantity: 2,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.EXCELLENT,
        location: 'Media Room 101',
        serialNumber: 'CAM-003',
      },
    }),
    // Audio Equipment
    prisma.asset.create({
      data: {
        name: 'Shure SM58 Microphone',
        description: 'Industry-standard dynamic vocal microphone',
        categoryId: audio.id,
        totalQuantity: 10,
        availableQuantity: 7,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Audio Store B2',
        serialNumber: 'MIC-001',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Yamaha MG16XU Mixer',
        description: '16-channel professional audio mixer with USB',
        categoryId: audio.id,
        totalQuantity: 2,
        availableQuantity: 1,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Audio Store B2',
        serialNumber: 'MIX-001',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'JBL EON615 Speaker',
        description: '15" two-way, self-powered PA speaker',
        categoryId: audio.id,
        totalQuantity: 4,
        availableQuantity: 4,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.EXCELLENT,
        location: 'Audio Store B2',
        serialNumber: 'SPK-001',
      },
    }),
    // Lighting
    prisma.asset.create({
      data: {
        name: 'Godox SL-200W Studio Light',
        description: '200W LED continuous studio light',
        categoryId: lighting.id,
        totalQuantity: 6,
        availableQuantity: 4,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Props Room C1',
        serialNumber: 'LGT-001',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Chauvet Intimidator Spot',
        description: 'LED moving head stage spotlight',
        categoryId: lighting.id,
        totalQuantity: 4,
        availableQuantity: 4,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.EXCELLENT,
        location: 'Stage Storage',
        serialNumber: 'LGT-002',
      },
    }),
    // Costumes
    prisma.asset.create({
      data: {
        name: 'Traditional Indian Costume Set',
        description: 'Complete set - kurta, dhoti, accessories for classical performances',
        categoryId: costumes.id,
        totalQuantity: 15,
        availableQuantity: 12,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Costume Room D1',
        serialNumber: 'CST-001',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Western Formal Costume',
        description: 'Formal suit and gown set for western performances',
        categoryId: costumes.id,
        totalQuantity: 10,
        availableQuantity: 10,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Costume Room D1',
        serialNumber: 'CST-002',
      },
    }),
    // Recording
    prisma.asset.create({
      data: {
        name: 'Sony FX3 Cinema Camera',
        description: 'Full-frame cinema line camera for professional video',
        categoryId: recording.id,
        totalQuantity: 2,
        availableQuantity: 2,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.EXCELLENT,
        location: 'Media Room 101',
        serialNumber: 'VID-001',
        purchaseDate: new Date('2023-01-10'),
      },
    }),
    prisma.asset.create({
      data: {
        name: 'DJI Ronin Stabilizer',
        description: '3-axis motorized gimbal for professional video',
        categoryId: recording.id,
        totalQuantity: 3,
        availableQuantity: 3,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Media Room 101',
        serialNumber: 'GIM-001',
      },
    }),
    // Infrastructure
    prisma.asset.create({
      data: {
        name: 'Portable Stage Platform',
        description: '4x8 ft modular stage platform, height adjustable',
        categoryId: infrastructure.id,
        totalQuantity: 20,
        availableQuantity: 20,
        status: AssetStatus.AVAILABLE,
        condition: AssetCondition.GOOD,
        location: 'Warehouse E1',
        serialNumber: 'STG-001',
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Event Tent (10x20 ft)',
        description: 'Heavy-duty outdoor event canopy tent',
        categoryId: infrastructure.id,
        totalQuantity: 5,
        availableQuantity: 3,
        status: AssetStatus.PARTIALLY_AVAILABLE,
        condition: AssetCondition.FAIR,
        location: 'Warehouse E1',
        serialNumber: 'TNT-001',
      },
    }),
  ]);

  // Create some sample bookings
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.booking.create({
      data: {
        userId: user1.id,
        assetId: assets[0].id, // Canon 5D
        quantity: 1,
        status: BookingStatus.APPROVED,
        purpose: 'Annual Techfest photography coverage',
        startDate: tomorrow,
        endDate: nextWeek,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user2.id,
        assetId: assets[3].id, // SM58 Mic
        quantity: 3,
        status: BookingStatus.ISSUED,
        purpose: 'Cultural night performance - Spandan',
        startDate: yesterday,
        endDate: tomorrow,
        issuedAt: yesterday,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user3.id,
        assetId: assets[6].id, // Studio Light
        quantity: 2,
        status: BookingStatus.PENDING,
        purpose: 'Photography workshop backdrop lighting',
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: user1.id,
        assetId: assets[10].id, // Sony FX3
        quantity: 1,
        status: BookingStatus.RETURNED,
        purpose: 'Documentary project - Campus Life',
        startDate: lastWeek,
        endDate: yesterday,
        issuedAt: lastWeek,
        returnedAt: yesterday,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user2.id,
        assetId: assets[8].id, // Traditional Costume
        quantity: 5,
        status: BookingStatus.APPROVED,
        purpose: 'Classical dance performance - Rangmanch',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.booking.create({
      data: {
        userId: user3.id,
        assetId: assets[4].id, // Yamaha Mixer
        quantity: 1,
        status: BookingStatus.REJECTED,
        purpose: 'Band practice session',
        startDate: yesterday,
        endDate: tomorrow,
        adminNote: 'Conflicting with Cultural Night booking. Please reschedule.',
      },
    }),
  ]);

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: AuditAction.ASSET_CREATED,
        entityType: 'Asset',
        entityId: assets[0].id,
        details: { assetName: 'Canon EOS 5D Mark IV' },
      },
      {
        userId: user1.id,
        action: AuditAction.BOOKING_CREATED,
        entityType: 'Booking',
        details: { assetName: 'Canon EOS 5D Mark IV', quantity: 1 },
      },
      {
        userId: admin.id,
        action: AuditAction.BOOKING_APPROVED,
        entityType: 'Booking',
        details: { userName: 'Rahul Sharma', assetName: 'Canon EOS 5D Mark IV' },
      },
    ],
  });

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        type: NotificationType.BOOKING_APPROVED,
        title: 'Booking Approved',
        message: 'Your booking for Canon EOS 5D Mark IV has been approved.',
        isRead: false,
      },
      {
        userId: user2.id,
        type: NotificationType.BOOKING_APPROVED,
        title: 'Booking Approved',
        message: 'Your booking for Traditional Indian Costume Set has been approved.',
        isRead: false,
      },
      {
        userId: user3.id,
        type: NotificationType.BOOKING_REJECTED,
        title: 'Booking Rejected',
        message: 'Your booking for Yamaha MG16XU Mixer was rejected. Conflicting with Cultural Night booking.',
        isRead: true,
      },
    ],
  });

  console.log('✅ Seeding completed!');
  console.log('\nTest Credentials:');
  console.log('Admin: admin@iitroorkee.ac.in / admin123');
  console.log('User:  rahul.sharma@iitr.ac.in / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
