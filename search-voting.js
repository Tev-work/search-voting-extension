run();

async function run () {
    // TODO something more robust
    const searchResults = document.querySelector('#search > div > div')?.children;
    if (!searchResults || !searchResults.length) {
        return;
    }

    const voteCountElements = [];

    Array.from(searchResults).forEach(element => {
        const anchor = element.querySelector('a');
        const url = anchor.href;
        const hostname = (new URL(url)).hostname.replace('www.', '');

        element.classList.add('search-result');

        const votingContainer = document.createElement('div');
        votingContainer.className = 'voting-container';
        
        const upvoteBtn = document.createElement('button');
        upvoteBtn.textContent = '+';
        upvoteBtn.className = 'voting-button voting-upvote';
        upvoteBtn.votingAction = 'voting-upvote';
        votingContainer.appendChild(upvoteBtn);

        const voteCount = document.createElement('span');
        voteCount.textContent = 'LD';
        voteCount.className = 'voting-count';
        voteCount.dataset.hostname = hostname;
        votingContainer.appendChild(voteCount);
        voteCountElements.push(voteCount);
        
        const downvoteBtn = document.createElement('button');
        downvoteBtn.textContent = '-';
        downvoteBtn.className = 'voting-button voting-downvote';
        downvoteBtn.votingAction = 'voting-downvote';
        votingContainer.appendChild(downvoteBtn);

        const votingListener = (thisBtn, otherBtn) => () => {
            if (votingContainer.voteSent) {
                if (thisBtn.voteSent) {
                    thisBtn.voteSent = false;
                    votingContainer.voteSent = false;
                    thisBtn.classList.remove('vote-sent');
                    chrome.runtime.sendMessage({ [otherBtn.votingAction]: hostname });
                } else {
                    otherBtn.voteSent = false;
                    thisBtn.voteSent = true;
                    otherBtn.classList.remove('vote-sent');
                    thisBtn.classList.add('vote-sent');
                    // sending twice to revert otherBtn vote
                    chrome.runtime.sendMessage({ [thisBtn.votingAction]: hostname })
                        .then(() => chrome.runtime.sendMessage({ [thisBtn.votingAction]: hostname }));
                }
            } else {
                thisBtn.voteSent = true;
                votingContainer.voteSent = true;
                thisBtn.classList.add('vote-sent');
                chrome.runtime.sendMessage({ [thisBtn.votingAction]: hostname });
            }
        }

        upvoteBtn.addEventListener('click', votingListener(upvoteBtn, downvoteBtn))
        downvoteBtn.addEventListener('click', votingListener(downvoteBtn, upvoteBtn))
        
        element.appendChild(votingContainer);
    });

    const votes = await chrome.runtime.sendMessage({ getVotes: true });
    voteCountElements.forEach(element => {
        element.textContent = votes[element.dataset.hostname] ?? 0;
    });
}