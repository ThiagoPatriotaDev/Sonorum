import test from 'node:test';
import assert from 'node:assert/strict';
import {recifeLocalToUtc,intervalsOverlap,isValidReservationInterval} from '../frontend/src/utils/roomTime.js';
const interval=(date,a,b)=>({starts_at:recifeLocalToUtc(date,a),ends_at:recifeLocalToUtc(date,b)});
const day='2026-11-24';
test('America/Recife 14:00 becomes 17:00Z',()=>assert.equal(recifeLocalToUtc(day,'14:00'),'2026-11-24T17:00:00.000Z'));
test('adjacent [) boundaries are not overlapping',()=>assert.equal(intervalsOverlap(interval(day,'14:00','15:00'),interval(day,'15:00','16:00')),false));
test('one minute overlap is caught',()=>assert.equal(intervalsOverlap(interval(day,'14:00','15:00'),interval(day,'14:59','16:00')),true));
test('room hours valid duration 30m to 8h',()=>{
 const fixedNow=Date.parse(recifeLocalToUtc(day,'10:00'));
 assert.equal(isValidReservationInterval(interval(day,'14:00','14:30'),fixedNow),true);
 assert.equal(isValidReservationInterval(interval(day,'14:00','14:20'),fixedNow),false);
 assert.equal(isValidReservationInterval(interval(day,'14:00','22:00'),fixedNow),true);
 assert.equal(isValidReservationInterval(interval(day,'14:00','22:15'),fixedNow),false);
});
test('rejects past and reversed ranges',()=>{
 const fixedNow=Date.parse(recifeLocalToUtc(day,'15:00'));
 assert.equal(isValidReservationInterval(interval(day,'14:00','15:00'),fixedNow),false);
 assert.equal(isValidReservationInterval(interval(day,'18:00','17:00'),fixedNow),false);
});
