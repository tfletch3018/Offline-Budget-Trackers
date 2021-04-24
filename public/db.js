let db;
let budgetVersion;
// create a new db request for a "BudgetDB" database.
const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  // create object store called "BudgetStore" and set autoIncrement to true
  console.log("Upgrade needed in IndexDB");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (event) {
  // log error here
  console.log(`Woops! ${e.target.errorCode}`);
};



function checkDatabase() {
  console.log('check db invoked');

  // open a transaction on your pending db
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your pending object store
  const store = transaction.objectStore('BudgetStore');

  // get all records from store and set to a variable
  const getAll = store.getAll();

  //If request was successful
  getAll.onsuccess = function () {

    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {

          // If our returned response is not empty
          if (res.length !== 0) {

            // Open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('BudgetStore');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};


function saveRecord(record) {
  console.log('Save record invoked');

  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your pending object store
  const store = transaction.objectStore('BudgetStore');

  // add record to your store with add method.
  store.add(record);
};

//Listen for app coming back online
window.addEventListener('online', checkDatabase);
