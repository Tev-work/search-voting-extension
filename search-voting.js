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

        element.classList.add('voting-search-result');

        const votingContainer = document.createElement('div');
        votingContainer.className = 'voting-container';
        
        const upvoteBtn = document.createElement('button');
        upvoteBtn.textContent = '+';
        upvoteBtn.className = 'voting-button voting-upvote';
        upvoteBtn.votingAction = 'voting-upvote';
        votingContainer.appendChild(upvoteBtn);

        const voteCount = document.createElement('span');
        voteCount.appendChild(createSpinner());
        voteCount.className = 'voting-count vote-loading';
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
        element.classList.remove('vote-loading')
    });
}

function createSpinner() {
    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = 'voting-spinner';

    const spinnerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spinnerSvg.classList.add('spinner-animation');
    const spinnerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    spinnerCircle.classList.add('spinner-path');

    spinnerSvg.setAttribute('viewBox', '0 0 50 50');
    spinnerCircle.setAttribute('cx', '25');
    spinnerCircle.setAttribute('cy', '25');
    spinnerCircle.setAttribute('r', '20');
    spinnerCircle.setAttribute('fill', 'none');
    spinnerCircle.setAttribute('stroke-width', '5');
  
    spinnerSvg.appendChild(spinnerCircle);
    spinnerDiv.appendChild(spinnerSvg);
    
    return spinnerDiv;
};