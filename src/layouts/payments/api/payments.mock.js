import { samplePayments } from '../layouts/leases/data/samplePayments';
import { sampleLeases } from '../layouts/leases/data/sampleLeases';
import { sampleTenants } from '../layouts/leases/data/sampleTenants';
import { sampleStalls } from '../layouts/leases/data/sampleStalls';
import { sampleUsers } from '../layouts/leases/data/sampleUsers';

const clone = obj => JSON.parse(JSON.stringify(obj));
let payments = clone(samplePayments);

function withNested(obj) {
  const lease = sampleLeases.find(l => l.id === obj.lease);
  const tenant = sampleTenants.find(t => t.id === obj.tenant);
  const stall = sampleStalls.find(s => s.id === obj.stall);
  const received_by = sampleUsers.find(u => u.id === obj.received_by);
  return {
    ...obj,
    lease: lease ? clone(lease) : null,
    tenant: tenant ? clone(tenant) : null,
    stall: stall ? clone(stall) : null,
    received_by: received_by ? clone(received_by) : null,
  };
}

export const getPayments = async () => {
  return new Promise(resolve =>
    setTimeout(() => resolve(payments.map(withNested)), 200)
  );
};

export const getPaymentById = async id => {
  const found = payments.find(p => p.id === Number(id));
  return new Promise(resolve =>
    setTimeout(() => resolve(found ? withNested(found) : null), 100)
  );
};

export const addPayment = async data => {
  const newId = payments.length ? Math.max(...payments.map(p => p.id)) + 1 : 1;
  const payment = {
    ...data,
    id: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  payments.push(payment);
  return new Promise(resolve =>
    setTimeout(() => resolve(withNested(payment)), 150)
  );
};

export const updatePayment = async (id, updates) => {
  const idx = payments.findIndex(p => p.id === Number(id));
  if (idx === -1) return null;
  payments[idx] = { ...payments[idx], ...updates, updated_at: new Date().toISOString() };
  return new Promise(resolve =>
    setTimeout(() => resolve(withNested(payments[idx])), 120)
  );
};

export const deletePayment = async id => {
  const idx = payments.findIndex(p => p.id === Number(id));
  if (idx === -1) return null;
  const [removed] = payments.splice(idx, 1);
  return new Promise(resolve =>
    setTimeout(() => resolve(withNested(removed)), 100)
  );
};
