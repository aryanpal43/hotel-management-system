const AuditLog = require('../models/AuditLog');

const logAction = async ({
  hotelId = null,
  userId,
  userEmail,
  action,
  details = '',
  oldValues = null,
  newValues = null,
  ipAddress = '',
}) => {
  try {
    const log = new AuditLog({
      hotelId,
      userId,
      userEmail,
      action,
      details,
      oldValues,
      newValues,
      ipAddress,
    });
    await log.save();
    console.log(`[Audit Log] Success - Action: ${action} by User: ${userEmail}`);
    return log;
  } catch (error) {
    console.error('[Audit Service Error] Failed to log action:', error.message);
  }
};

module.exports = { logAction };
