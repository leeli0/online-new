// must setup a test redis server
// as redis-mock's api doesn't consist with redis package

const { expect } = require('chai');
const sinon = require('sinon');
const redis = require('redis');
const Online = require('./index.js');

describe('Online', function () {
    let client;
    let online;

    beforeEach(async function () {
        client = await redis.createClient()
            .on('error', err => console.log('Redis Client Error', err))
            .connect();
        online = new Online(client);
    });

    afterEach(async function () {
        await client.flushAll();
        sinon.restore();
    });

    describe('#clear', function () {
        it('should clear all tracked activity', async function () {
            await client.sAdd('online:30', 'user1');
            await client.sAdd('online:31', 'user2');
            await online.clear();
            const keys = await client.keys('online:*');
            expect(keys).to.have.lengthOf(0);
        });
    });

    describe('#add', function () {
        it('should add a user ID to the current minute set', async function () {
            const key = await online.add('user1');
            const memebers = await client.sMembers(key);
            expect(memebers).to.include('user1');
        });

        it('should set the expiration time for the current minute set', async function () {
            const key = await online.add('user1');
            const ttl = await client.ttl(key);
            expect(ttl).to.be.above(0).and.to.be.at.most(900);
        });
    });

    describe('#last', function () {
        it('should get active user IDs within the last `n` minutes', async function () {
            const min = new Date().getMinutes();
            const prevMin = (min - 1 + 60) % 60;
            await client.sAdd(`online:${min}`, 'user1');
            await client.sAdd(`online:${prevMin}`, 'user2');

            const activeUsers = await online.last(1);
            expect(activeUsers).to.include('user1').and.to.include('user2');
        });

        it('should return an empty array if no users were active in the last `n` minutes', async function () {
            const activeUsers = await online.last(5);
            expect(activeUsers).to.be.an('array').that.is.empty;
        });
    });
});

