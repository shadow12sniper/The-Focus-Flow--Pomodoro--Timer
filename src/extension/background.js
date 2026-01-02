
/**
 * FocusFlow Background Service Worker
 * Handles site blocking using the declarativeNetRequest API.
 */

// Listen for messages from the Angular Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_BLOCKING_STATE') {
    handleBlockingUpdate(message.isBlocking, message.sites);
  }
});

/**
 * Updates the dynamic blocking rules.
 * @param {boolean} isBlocking - Whether blocking should be active.
 * @param {string[]} sites - List of domains to block.
 */
async function handleBlockingUpdate(isBlocking, sites) {
  try {
    // 1. Get all current dynamic rules to clean them up
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = currentRules.map(rule => rule.id);

    // 2. If we are not blocking or have no sites, just clear rules
    if (!isBlocking || !sites || sites.length === 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove
      });
      await updateBadge(false);
      return;
    }

    // 3. Create new rules for each site
    // Rule IDs must be integers. We use index + 1.
    const newRules = sites.map((site, index) => {
      return {
        id: index + 1,
        priority: 1,
        action: { 
          type: 'block' 
        },
        condition: {
          urlFilter: `||${site}`, 
          resourceTypes: ['main_frame', 'sub_frame'] 
        }
      };
    });

    // 4. Update the rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: newRules
    });

    await updateBadge(true);

  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}

/**
 * Updates the extension badge to indicate status.
 */
async function updateBadge(isActive) {
  if (isActive) {
    await chrome.action.setBadgeText({ text: 'ON' });
    await chrome.action.setBadgeBackgroundColor({ color: '#f43f5e' }); // Rose-500
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}
