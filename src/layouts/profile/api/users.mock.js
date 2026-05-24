import { sampleUsers } from '../layouts/leases/data/sampleUsers';

const clone = obj => JSON.parse(JSON.stringify(obj));
let users = clone(sampleUsers);

export const getUsers = async () => {
  return new Promise(resolve =>
    setTimeout(() => resolve(users.map(clone)), 200)
  );
};

export const getUserById = async id => {
  const found = users.find(u => u.id === Number(id));
  return new Promise(resolve =>
    setTimeout(() => resolve(found ? clone(found) : null), 100)
  );
};

export const addUser = async data => {
  const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const user = {
    ...data,
    id: newId,
  };
  users.push(user);
  return new Promise(resolve =>
    setTimeout(() => resolve(clone(user)), 150)
  );
};

export const updateUser = async (id, updates) => {
  const idx = users.findIndex(u => u.id === Number(id));
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  return new Promise(resolve =>
    setTimeout(() => resolve(clone(users[idx])), 120)
  );
};

export const deleteUser = async id => {
  const idx = users.findIndex(u => u.id === Number(id));
  if (idx === -1) return null;
  const [removed] = users.splice(idx, 1);
  return new Promise(resolve =>
    setTimeout(() => resolve(clone(removed)), 100)
  );
};
