chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https?:\/\/www.google.com\//.test(tab.url)) {
        chrome.scripting
            .insertCSS({
                target: { tabId },
                files: ["voting-styles.css"],
            })
        chrome.scripting
            .executeScript({
                target: { tabId },
                files: ["./search-voting.js"]
            })
            .catch(err => console.warn('injecting content script failed:', err));
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.getVotes) {
        (async () => {
            const votes = await getVotes();
            sendResponse(votes);
        })();

        return true;
    } else if (request['voting-upvote']) {
        vote(request['voting-upvote'], 'upvote');
    } else if (request['voting-downvote']) {
        vote(request['voting-downvote'], 'downvote');
    }
});

const TABLE_NAME = "votesByDomain";


async function getVotes() {
    const db = await getDB();
    return new Promise((resolve, reject) => { 
        const request = getVotesObjectStore(db).openCursor();

        const allVotes = {};
        request.onsuccess = (event) => {
            let cursor = event.target.result;
            if (cursor) {
                let key = cursor.primaryKey;
                let value = cursor.value;
                allVotes[key] = value;
                cursor.continue();
            }
            else {
                resolve(allVotes);
            }
        }

        request.onerror = (event) => {
            console.warn('error getting votes', request.errorCode, event);
            reject();
        }
    });
}

async function vote(hostname, direction) {
    const db = await getDB();

    return new Promise((resolve, reject) => { 
        const store = getVotesObjectStore(db, 'readwrite')
        const request = store.get(hostname);;

        request.onsuccess = (event) => {
            const diff = direction === 'upvote' ? 1 : -1;

            if (request.result === undefined) {
                store.add(diff, hostname);
            } else {
                store.put(request.result + diff, hostname);
            }
            resolve(request.result);
        }

        request.onerror = (event) => {
            console.warn('DB error when voting', request.errorCode, event);
            reject();
        }
    });
}

function getVotesObjectStore(db, mode = 'readonly') {
    const transaction = db.transaction([TABLE_NAME], mode);
        
    transaction.onerror = (event) => {
        console.warn('transaction error:', error, event);
    };

    return transaction.objectStore(TABLE_NAME);
}

async function getDB() {
    return new Promise((resolve, reject) => { 
        const dbName = "SearchVotingDatabase";
        const dbRequest = indexedDB.open(dbName, 3);

        dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(TABLE_NAME);
        };

        dbRequest.onerror = (event) => {
            console.warn('getting DB error:', dbRequest.errorCode, event);
            reject();
        };
        dbRequest.onsuccess = (/* event */) => {
            resolve(dbRequest.result);
        };
    });
}