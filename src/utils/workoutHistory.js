let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('spinnn', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workouts', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(request.error); };
    request.onblocked = () => { database = null; reject(new Error('Storage upgrade blocked')); };
  });
  return database;
}
async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', mode);
    const request = operation(tx.objectStore('workouts'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error || request.error);
    tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
  });
}
export const workoutHistory = {
  save: workout => transaction('readwrite', store => store.put(JSON.parse(JSON.stringify(workout)))),
  get: id => transaction('readonly', store => store.get(id)),
  list: async () => (await transaction('readonly', store => store.getAll())).sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
  delete: id => transaction('readwrite', store => store.delete(id)),
};
