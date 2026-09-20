/**
 * Comprehensive End-to-End Verification Test Script for CourierX
 */

require('dotenv').config();
const http = require('http');

const PORT = parseInt(process.env.PORT, 10) || 5001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, cookies = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        if (cookies) {
            options.headers['Cookie'] = cookies;
        }

        let payload = null;
        if (body) {
            if (typeof body === 'string') {
                payload = body;
            } else {
                payload = new URLSearchParams(body).toString();
            }
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => { resBody += chunk; });
            res.on('end', () => {
                const setCookie = res.headers['set-cookie'];
                let newCookies = cookies;
                if (setCookie) {
                    newCookies = setCookie.map(c => c.split(';')[0]).join('; ');
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: resBody,
                    cookies: newCookies,
                    location: res.headers['location']
                });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 ========================================================');
    console.log(`🧪 STARTING COURIERX TEST SUITE ON PORT ${PORT}`);
    console.log('🧪 ========================================================\n');

    let passed = 0;
    let failed = 0;

    const assert = (condition, description) => {
        if (condition) {
            console.log(`  ✅ PASS: ${description}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${description}`);
            failed++;
        }
    };

    try {
        // 1. Landing Page (GET /)
        console.log('Test Group 1: Public Pages');
        const homeRes = await request('GET', '/');
        assert(homeRes.status === 200, 'GET / returns 200 OK');
        assert(homeRes.body.includes('COURIERX') && homeRes.body.includes('Delivering trust'), 'Home page contains branding and tagline');
        assert(homeRes.body.includes('Track Your Parcel'), 'Home page contains tracking section');

        // 2. Public Tracking (GET /track & POST /track)
        const trackEmpty = await request('GET', '/track');
        assert(trackEmpty.status === 200, 'GET /track returns 200 OK');

        const trackFound = await request('POST', '/track', { trackingId: 'CRX-4A72B9' });
        assert(trackFound.status === 200 && trackFound.body.includes('In Transit'), 'POST /track finds seeded parcel CRX-4A72B9 in transit');
        assert(trackFound.body.includes('Detailed Checkpoint Journey'), 'Public track displays visual checkpoint journey');

        const trackMissing = await request('POST', '/track', { trackingId: 'CRX-INVALID99' });
        assert(trackMissing.status === 200 && trackMissing.body.includes('No shipment found'), 'POST /track displays error for non-existent tracking code');

        // 3. User Registration (POST /register)
        console.log('\nTest Group 2: Authentication & Roles');
        const testCustomerEmail = `cust_${Date.now()}@test.com`;
        const regRes = await request('POST', '/register', {
            name: 'Test Customer User',
            email: testCustomerEmail,
            phone: '9988776655',
            password: 'Password@123',
            confirmPassword: 'Password@123',
            role: 'CUSTOMER'
        });
        assert(regRes.status === 302 && regRes.location === '/login', 'POST /register creates customer and redirects to /login');

        // Block public registration as ADMIN
        const adminRegBlock = await request('POST', '/register', {
            name: 'Hacker Admin',
            email: `fakeadmin_${Date.now()}@test.com`,
            phone: '9988776655',
            password: 'Password@123',
            confirmPassword: 'Password@123',
            role: 'ADMIN'
        });
        assert(adminRegBlock.body.includes('Admin registration is restricted'), 'Public registration as ADMIN is strictly prevented');

        // 4. Customer Login & Dashboard
        const custLogin = await request('POST', '/login', {
            email: testCustomerEmail,
            password: 'Password@123'
        });
        assert(custLogin.status === 302 && custLogin.location === '/customer/dashboard', 'Customer login succeeds & redirects to /customer/dashboard');
        const custCookies = custLogin.cookies;

        const custDash = await request('GET', '/customer/dashboard', null, custCookies);
        assert(custDash.status === 200 && custDash.body.includes('Test Customer User'), 'Customer dashboard displays customer name');

        // 5. Customer Protected Route Guard Check
        const guestAccessDash = await request('GET', '/customer/dashboard');
        assert(guestAccessDash.status === 302 && guestAccessDash.location === '/login', 'Unauthenticated dashboard access is redirected to /login');

        // 6. Live Charge Calculation via JSON API
        console.log('\nTest Group 3: Parcel Booking & Pricing');
        const calcRes = await new Promise((resolve) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: PORT,
                path: '/customer/calculate-charge',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': custCookies
                }
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.write(JSON.stringify({ weight: 2.5, pickupPincode: '110001', dropPincode: '201301' }));
            req.end();
        });
        assert(calcRes.success === true && calcRes.estimatedCharge === 100, 'calculateCharge API computes correct tiered price (₹80 * 1.25 = ₹100)');

        // 7. Customer Books a Parcel
        const bookRes = await request('POST', '/customer/parcels/book', {
            senderName: 'Test Customer User',
            senderPhone: '9988776655',
            senderAddress: 'Connaught Place 10',
            senderPincode: '110001',
            receiverName: 'Rohan Sharma',
            receiverPhone: '9876501234',
            receiverAddress: 'Sector 62, Commercial Hub',
            receiverPincode: '201301',
            weight: '2.5',
            parcelType: 'Package',
            description: 'Important Samples Box',
            pickupAddress: 'Connaught Place 10',
            pickupPincode: '110001',
            dropAddress: 'Sector 62, Commercial Hub',
            dropPincode: '201301'
        }, custCookies);
        assert(bookRes.status === 302 && bookRes.location.startsWith('/customer/parcels/'), 'Parcel booking succeeds and redirects to details view');

        const newParcelDetailsPath = bookRes.location;
        const newParcelId = newParcelDetailsPath.split('/').pop();
        const newParcelView = await request('GET', newParcelDetailsPath, null, custCookies);
        assert(newParcelView.status === 200 && newParcelView.body.includes('Booked'), 'New parcel status is Booked with tracking ID');

        // Extract tracking ID
        const match = newParcelView.body.match(/CRX-[A-Z0-9]{6}/);
        const newTrackingId = match ? match[0] : null;
        assert(newTrackingId !== null, `Generated unique tracking ID: ${newTrackingId}`);

        // 8. Admin Login & Dashboard
        console.log('\nTest Group 4: Admin Management & Dispatch');
        const adminLogin = await request('POST', '/login', {
            email: 'admin@courierx.com',
            password: 'Admin@123'
        });
        assert(adminLogin.status === 302 && adminLogin.location === '/admin/dashboard', 'Admin login redirects to /admin/dashboard');
        const adminCookies = adminLogin.cookies;

        const adminDash = await request('GET', '/admin/dashboard', null, adminCookies);
        assert(adminDash.status === 200 && adminDash.body.includes('Admin Logistics Operations'), 'Admin dashboard loads operational metrics');
        assert(adminDash.body.includes('statusChart') && adminDash.body.includes('dailyChart'), 'Admin dashboard renders Chart.js canvases');

        // 9. Admin Assigns Agent to the Newly Booked Parcel
        const agentsView = await request('GET', '/admin/agents', null, adminCookies);
        assert(agentsView.status === 200 && agentsView.body.includes('Vikram Singh'), 'Admin agents view displays registered couriers');

        const assignFormView = await request('GET', `/admin/parcels/${newParcelId}/assign`, null, adminCookies);
        assert(assignFormView.status === 200, 'Admin can view assign parcel form');

        // Get Vikram ID with specific regex
        const agentOptionMatch = assignFormView.body.match(/<option value="([0-9a-fA-F]{24})"[^>]*>\s*Vikram Singh/);
        const vikramAgentId = agentOptionMatch ? agentOptionMatch[1] : null;
        assert(vikramAgentId !== null, `Found active Vikram agent ID: ${vikramAgentId}`);

        const assignRes = await request('POST', `/admin/parcels/${newParcelId}/assign`, {
            agentId: vikramAgentId
        }, adminCookies);
        assert(assignRes.status === 302, 'Admin assigned Vikram Singh to parcel');

        // 10. Agent Login & Workflow State Machine
        console.log('\nTest Group 5: Agent Workflow & State Machine');
        const agentLogin = await request('POST', '/login', {
            email: 'agent.vikram@courierx.com',
            password: 'Agent@123'
        });
        assert(agentLogin.status === 302 && agentLogin.location === '/agent/dashboard', 'Agent login redirects to /agent/dashboard');
        const agentCookies = agentLogin.cookies;

        const agentDash = await request('GET', '/agent/dashboard', null, agentCookies);
        assert(agentDash.status === 200 && agentDash.body.includes(newTrackingId), 'Agent dashboard displays newly assigned parcel');

        // Step A: Update to PICKED_UP
        const update1 = await request('POST', `/agent/parcels/${newParcelId}/status`, {
            nextStatus: 'PICKED_UP',
            location: 'Connaught Place Pickup Point',
            remarks: 'Parcel collected from sender.'
        }, agentCookies);
        assert(update1.status === 302, 'Agent successfully transitions BOOKED ➔ PICKED_UP');

        // Illegal transition check: Cannot jump directly from PICKED_UP to DELIVERED
        const illegalUpdate = await request('POST', `/agent/parcels/${newParcelId}/status`, {
            nextStatus: 'DELIVERED',
            location: 'Doorstep',
            remarks: 'Illegal jump attempt'
        }, agentCookies);
        assert(illegalUpdate.status === 302, 'Illegal transition handled gracefully');
        const checkAfterIllegal = await request('GET', `/agent/parcels/${newParcelId}`, null, agentCookies);
        assert(checkAfterIllegal.body.includes('Invalid status transition'), 'Illegal status transition blocked by state machine');

        // Step B: PICKED_UP ➔ IN_TRANSIT
        const update2 = await request('POST', `/agent/parcels/${newParcelId}/status`, {
            nextStatus: 'IN_TRANSIT',
            location: 'Central Sorting Hub',
            remarks: 'Processed at sorting facility.'
        }, agentCookies);
        assert(update2.status === 302, 'Agent transitions PICKED_UP ➔ IN_TRANSIT');

        // Step C: IN_TRANSIT ➔ OUT_FOR_DELIVERY
        const update3 = await request('POST', `/agent/parcels/${newParcelId}/status`, {
            nextStatus: 'OUT_FOR_DELIVERY',
            location: 'Noida Sector 62 Van',
            remarks: 'Out for final delivery.'
        }, agentCookies);
        assert(update3.status === 302, 'Agent transitions IN_TRANSIT ➔ OUT_FOR_DELIVERY');

        // Step D: OUT_FOR_DELIVERY ➔ DELIVERED
        const deliveredRes = await request('POST', `/agent/parcels/${newParcelId}/status`, {
            nextStatus: 'DELIVERED',
            location: 'Recipient Doorstep',
            remarks: 'Delivered and signed by Rohan Sharma.'
        }, agentCookies);
        assert(deliveredRes.status === 302, 'Agent completes delivery flow: OUT_FOR_DELIVERY ➔ DELIVERED');

        // 11. Public Tracking Verification of Completed Journey
        console.log('\nTest Group 6: Public Audit & Error Handling');
        const publicTrackFinal = await request('POST', '/track', { trackingId: newTrackingId });
        assert(publicTrackFinal.body.includes('Delivered') && publicTrackFinal.body.includes('Recipient Doorstep'), 'Public tracking shows complete journey with all checkpoints');

        // 12. 404 Handler Verification
        const notFoundRes = await request('GET', '/some-non-existent-route-12345');
        assert(notFoundRes.status === 404 && notFoundRes.body.includes('Page Not Found'), 'Centralized 404 handler returns themed 404 page');

        console.log('\n========================================================');
        console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log('========================================================');
        
        process.exit(failed > 0 ? 1 : 0);

    } catch (err) {
        console.error('Fatal test execution error:', err);
        process.exit(1);
    }
}

runTests();
