require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const DeliveryZone = require('../models/DeliveryZone');
const Parcel = require('../models/Parcel');
const StatusHistory = require('../models/StatusHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/courierx';

const seedDatabase = async () => {
    try {
        console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('[Seed] Connected successfully.');

        // Clean existing collections
        console.log('[Seed] Clearing existing collections...');
        await Promise.all([
            User.deleteMany({}),
            DeliveryZone.deleteMany({}),
            Parcel.deleteMany({}),
            StatusHistory.deleteMany({})
        ]);
        console.log('[Seed] Database cleared.');

        // 1. Seed Delivery Zones
        console.log('[Seed] Seeding Delivery Zones...');
        const zones = await DeliveryZone.create([
            {
                name: 'Delhi Central & South',
                pincodes: ['110001', '110002', '110003', '110005', '110006', '110020', '110025'],
                baseMultiplier: 1.0,
                isActive: true
            },
            {
                name: 'Noida & Greater Noida',
                pincodes: ['201301', '201303', '201304', '201305', '201307', '201308', '201310'],
                baseMultiplier: 1.25,
                isActive: true
            },
            {
                name: 'Gurgaon Cyber City & Central',
                pincodes: ['122001', '122002', '122003', '122018', '122022'],
                baseMultiplier: 1.25,
                isActive: true
            },
            {
                name: 'Ghaziabad Trans-Hindon',
                pincodes: ['201001', '201002', '201005', '201009', '201010', '201012'],
                baseMultiplier: 1.25,
                isActive: true
            },
            {
                name: 'Faridabad Industrial Corridor',
                pincodes: ['121001', '121002', '121003', '121004', '121005'],
                baseMultiplier: 1.5,
                isActive: true
            }
        ]);
        console.log(`[Seed] Created ${zones.length} delivery zones.`);

        // 2. Seed Admin User
        console.log('[Seed] Seeding Admin User...');
        const adminUser = new User({
            name: 'System Administrator',
            email: 'admin@courierx.com',
            phone: '9876543210',
            password: 'Admin@123',
            role: 'ADMIN',
            isActive: true
        });
        await adminUser.save();

        // 3. Seed Delivery Agents
        console.log('[Seed] Seeding Delivery Agents...');
        const agent1 = new User({
            name: 'Vikram Singh',
            email: 'agent.vikram@courierx.com',
            phone: '9811002233',
            password: 'Agent@123',
            role: 'AGENT',
            vehicleNumber: 'DL-01-AB-1234',
            zone: 'Delhi Central & South',
            isActive: true
        });
        await agent1.save();

        const agent2 = new User({
            name: 'Rahul Sharma',
            email: 'agent.rahul@courierx.com',
            phone: '9822334455',
            password: 'Agent@123',
            role: 'AGENT',
            vehicleNumber: 'UP-16-CD-5678',
            zone: 'Noida & Greater Noida',
            isActive: true
        });
        await agent2.save();

        // 4. Seed Customers
        console.log('[Seed] Seeding Customers...');
        const customer1 = new User({
            name: 'Aarav Mehta',
            email: 'customer1@gmail.com',
            phone: '9833445566',
            password: 'Customer@123',
            role: 'CUSTOMER',
            isActive: true
        });
        await customer1.save();

        const customer2 = new User({
            name: 'Pooja Verma',
            email: 'customer2@gmail.com',
            phone: '9844556677',
            password: 'Customer@123',
            role: 'CUSTOMER',
            isActive: true
        });
        await customer2.save();

        const customer3 = new User({
            name: 'Karan Malhotra',
            email: 'customer3@gmail.com',
            phone: '9855667788',
            password: 'Customer@123',
            role: 'CUSTOMER',
            isActive: true
        });
        await customer3.save();

        // 5. Seed Sample Parcels and Timeline History
        console.log('[Seed] Seeding Sample Parcels & Timelines...');

        // Parcel 1: BOOKED (Unassigned)
        const p1 = new Parcel({
            trackingId: 'CRX-8F4K29',
            customerId: customer1._id,
            agentId: null,
            senderName: 'Aarav Mehta',
            senderPhone: '9833445566',
            senderAddress: 'Flat 402, Sunshine Heights, Connaught Place',
            senderPincode: '110001',
            receiverName: 'Ramesh Gupta',
            receiverPhone: '9871112233',
            receiverAddress: 'Tower B, Sector 62, Commercial Zone',
            receiverPincode: '201301',
            weight: 1.5,
            parcelType: 'Document',
            description: 'Confidential Legal Property Contract Documents',
            pickupAddress: 'Flat 402, Sunshine Heights, Connaught Place',
            pickupPincode: '110001',
            dropAddress: 'Tower B, Sector 62, Commercial Zone',
            dropPincode: '201301',
            estimatedCharge: 100,
            zoneMultiplier: 1.25,
            status: 'BOOKED'
        });
        await p1.save();
        await StatusHistory.create({
            parcelId: p1._id,
            status: 'BOOKED',
            location: 'Online Booking Portal',
            remarks: 'Shipment created and scheduled for pickup.',
            updatedBy: customer1._id,
            timestamp: new Date(Date.now() - 2 * 3600 * 1000)
        });

        // Parcel 2: IN_TRANSIT (Assigned to Vikram)
        const p2 = new Parcel({
            trackingId: 'CRX-4A72B9',
            customerId: customer2._id,
            agentId: agent1._id,
            senderName: 'Pooja Verma',
            senderPhone: '9844556677',
            senderAddress: 'Sector 15, Block C, Noida',
            senderPincode: '201301',
            receiverName: 'Deepak Rao',
            receiverPhone: '9819998877',
            receiverAddress: 'DLF Phase 3, Cyber City',
            receiverPincode: '122002',
            weight: 4.2,
            parcelType: 'Electronics',
            description: 'Refurbished Test Laptop with Power Adapter',
            pickupAddress: 'Sector 15, Block C, Noida',
            pickupPincode: '201301',
            dropAddress: 'DLF Phase 3, Cyber City',
            dropPincode: '122002',
            estimatedCharge: 150,
            zoneMultiplier: 1.25,
            status: 'IN_TRANSIT'
        });
        await p2.save();
        await StatusHistory.create([
            {
                parcelId: p2._id,
                status: 'BOOKED',
                location: 'Online Portal',
                remarks: 'Booking confirmed.',
                updatedBy: customer2._id,
                timestamp: new Date(Date.now() - 10 * 3600 * 1000)
            },
            {
                parcelId: p2._id,
                status: 'PICKED_UP',
                location: 'Noida Sector 15 Collection Point',
                remarks: 'Parcel securely picked up from sender by Vikram Singh.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 6 * 3600 * 1000)
            },
            {
                parcelId: p2._id,
                status: 'IN_TRANSIT',
                location: 'Central Sorting Hub, South Delhi',
                remarks: 'Sorted and dispatched to Gurgaon Regional Hub.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 2 * 3600 * 1000)
            }
        ]);

        // Parcel 3: OUT_FOR_DELIVERY (Assigned to Rahul)
        const p3 = new Parcel({
            trackingId: 'CRX-99K2L1',
            customerId: customer1._id,
            agentId: agent2._id,
            senderName: 'Aarav Mehta',
            senderPhone: '9833445566',
            senderAddress: 'Connaught Place Outer Circle, Delhi',
            senderPincode: '110001',
            receiverName: 'Simran Kaur',
            receiverPhone: '9988776655',
            receiverAddress: 'Flat 101, Express Park View, Greater Noida',
            receiverPincode: '201310',
            weight: 2.0,
            parcelType: 'Fragile',
            description: 'Handcrafted Ceramic Dinnerware Set',
            pickupAddress: 'Connaught Place Outer Circle, Delhi',
            pickupPincode: '110001',
            dropAddress: 'Flat 101, Express Park View, Greater Noida',
            dropPincode: '201310',
            estimatedCharge: 100,
            zoneMultiplier: 1.25,
            status: 'OUT_FOR_DELIVERY'
        });
        await p3.save();
        await StatusHistory.create([
            {
                parcelId: p3._id,
                status: 'BOOKED',
                location: 'Customer Portal',
                remarks: 'Pickup request scheduled.',
                updatedBy: customer1._id,
                timestamp: new Date(Date.now() - 18 * 3600 * 1000)
            },
            {
                parcelId: p3._id,
                status: 'PICKED_UP',
                location: 'Central Delhi Hub',
                remarks: 'Collected with Fragile security tape.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 12 * 3600 * 1000)
            },
            {
                parcelId: p3._id,
                status: 'IN_TRANSIT',
                location: 'Noida Expressway Transfer Hub',
                remarks: 'In transit to Greater Noida distribution unit.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 5 * 3600 * 1000)
            },
            {
                parcelId: p3._id,
                status: 'OUT_FOR_DELIVERY',
                location: 'Greater Noida Delivery Van (Rahul Sharma)',
                remarks: 'Delivery attempt in progress. Estimated arrival within 2 hours.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 40 * 60 * 1000)
            }
        ]);

        // Parcel 4: DELIVERED (Assigned to Rahul)
        const p4 = new Parcel({
            trackingId: 'CRX-33M8X7',
            customerId: customer3._id,
            agentId: agent2._id,
            senderName: 'Karan Malhotra',
            senderPhone: '9855667788',
            senderAddress: 'Sector 50, Pocket A, Noida',
            senderPincode: '201301',
            receiverName: 'Neha Kapoor',
            receiverPhone: '9765432100',
            receiverAddress: 'Villa 12, Golf City, Sector 75, Noida',
            receiverPincode: '201304',
            weight: 0.8,
            parcelType: 'Package',
            description: 'Books and Stationery Gift Box',
            pickupAddress: 'Sector 50, Pocket A, Noida',
            pickupPincode: '201301',
            dropAddress: 'Villa 12, Golf City, Sector 75, Noida',
            dropPincode: '201304',
            estimatedCharge: 50,
            zoneMultiplier: 1.0,
            status: 'DELIVERED'
        });
        await p4.save();
        await StatusHistory.create([
            {
                parcelId: p4._id,
                status: 'BOOKED',
                location: 'Customer Portal',
                remarks: 'Parcel registered.',
                updatedBy: customer3._id,
                timestamp: new Date(Date.now() - 28 * 3600 * 1000)
            },
            {
                parcelId: p4._id,
                status: 'PICKED_UP',
                location: 'Noida Hub',
                remarks: 'Picked up from sender.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 24 * 3600 * 1000)
            },
            {
                parcelId: p4._id,
                status: 'IN_TRANSIT',
                location: 'Sector 75 Delivery Unit',
                remarks: 'Ready for local delivery dispatch.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 20 * 3600 * 1000)
            },
            {
                parcelId: p4._id,
                status: 'OUT_FOR_DELIVERY',
                location: 'Sector 75 Noida',
                remarks: 'Agent Rahul Sharma out for delivery.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 16 * 3600 * 1000)
            },
            {
                parcelId: p4._id,
                status: 'DELIVERED',
                location: 'Recipient Doorstep',
                remarks: 'Package successfully delivered and signed by Neha Kapoor.',
                updatedBy: agent2._id,
                timestamp: new Date(Date.now() - 15 * 3600 * 1000)
            }
        ]);

        // Parcel 5: FAILED (Assigned to Vikram)
        const p5 = new Parcel({
            trackingId: 'CRX-77F1D4',
            customerId: customer2._id,
            agentId: agent1._id,
            senderName: 'Pooja Verma',
            senderPhone: '9844556677',
            senderAddress: 'Sector 15, Noida',
            senderPincode: '201301',
            receiverName: 'Suresh Raina',
            receiverPhone: '9123456780',
            receiverAddress: 'House 55, Block D, Old Faridabad',
            receiverPincode: '121002',
            weight: 2.5,
            parcelType: 'Package',
            description: 'Customized Office Apparel Samples',
            pickupAddress: 'Sector 15, Noida',
            pickupPincode: '201301',
            dropAddress: 'House 55, Block D, Old Faridabad',
            dropPincode: '121002',
            estimatedCharge: 120,
            zoneMultiplier: 1.5,
            status: 'FAILED',
            failureReason: 'Customer unavailable'
        });
        await p5.save();
        await StatusHistory.create([
            {
                parcelId: p5._id,
                status: 'BOOKED',
                location: 'Customer Portal',
                remarks: 'Order booked.',
                updatedBy: customer2._id,
                timestamp: new Date(Date.now() - 36 * 3600 * 1000)
            },
            {
                parcelId: p5._id,
                status: 'PICKED_UP',
                location: 'Noida Sorting Facility',
                remarks: 'Collected from shipper.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 30 * 3600 * 1000)
            },
            {
                parcelId: p5._id,
                status: 'IN_TRANSIT',
                location: 'Faridabad Transit Hub',
                remarks: 'Transferred to southern delivery route.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 22 * 3600 * 1000)
            },
            {
                parcelId: p5._id,
                status: 'OUT_FOR_DELIVERY',
                location: 'Old Faridabad Sub-Zone',
                remarks: 'Agent attempting delivery.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 8 * 3600 * 1000)
            },
            {
                parcelId: p5._id,
                status: 'FAILED',
                location: 'Old Faridabad Sub-Zone',
                remarks: 'Delivery Failed: Customer unavailable after 3 phone attempts.',
                updatedBy: agent1._id,
                timestamp: new Date(Date.now() - 6 * 3600 * 1000)
            }
        ]);

        console.log('===============================================================');
        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
        console.log('===============================================================');
        console.log('Sample Credentials for Development & Viva Demonstration:');
        console.log('---------------------------------------------------------------');
        console.log('👑 ADMIN:');
        console.log('   Email:    admin@courierx.com');
        console.log('   Password: Admin@123');
        console.log('---------------------------------------------------------------');
        console.log('🚚 DELIVERY AGENTS:');
        console.log('   Email:    agent.vikram@courierx.com | Password: Agent@123');
        console.log('   Email:    agent.rahul@courierx.com  | Password: Agent@123');
        console.log('---------------------------------------------------------------');
        console.log('👤 CUSTOMERS:');
        console.log('   Email:    customer1@gmail.com | Password: Customer@123');
        console.log('   Email:    customer2@gmail.com | Password: Customer@123');
        console.log('   Email:    customer3@gmail.com | Password: Customer@123');
        console.log('---------------------------------------------------------------');
        console.log('📦 SAMPLE TRACKING CODES TO TEST IN /track:');
        console.log('   • CRX-8F4K29 (Status: BOOKED)');
        console.log('   • CRX-4A72B9 (Status: IN_TRANSIT)');
        console.log('   • CRX-99K2L1 (Status: OUT_FOR_DELIVERY)');
        console.log('   • CRX-33M8X7 (Status: DELIVERED)');
        console.log('   • CRX-77F1D4 (Status: FAILED - Customer unavailable)');
        console.log('===============================================================');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('[Seed] Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();
