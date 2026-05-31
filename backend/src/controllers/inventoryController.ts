const Inventory = require('../models/Inventory');
const { logAction } = require('../services/auditService');

// Get all inventory stock levels
const getInventoryItems = async (req, res) => {
  try {
    const items = await Inventory.find({ hotelId: req.hotelId }).sort({ itemName: 1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add new inventory item catalog
const createInventoryItem = async (req, res) => {
  const { itemName, category, stockLevel, minStockLevel, unit } = req.body;

  try {
    const item = new Inventory({
      hotelId: req.hotelId,
      itemName,
      category,
      stockLevel: stockLevel || 0,
      minStockLevel: minStockLevel || 5,
      unit: unit || 'pcs',
    });

    if (stockLevel && stockLevel > 0) {
      item.movements.push({
        type: 'Add',
        quantity: stockLevel,
        reason: 'Initial Stock Provision',
        date: new Date(),
        userId: req.user._id,
      });
    }

    const savedItem = await item.save();

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_INVENTORY_ITEM',
      details: `Added new inventory item: ${itemName} (Stock: ${stockLevel || 0})`,
    });

    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Adjust stock level (Movement logging)
const adjustInventoryStock = async (req, res) => {
  const { itemId, type, quantity, reason } = req.body;

  try {
    const item = await Inventory.findOne({ _id: itemId, hotelId: req.hotelId });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    const oldValues = JSON.parse(JSON.stringify(item));
    const qty = parseInt(quantity);

    if (type === 'Add') {
      item.stockLevel += qty;
    } else if (type === 'Deduct' || type === 'Assigned To Housekeeping') {
      if (item.stockLevel < qty) {
        return res.status(400).json({ error: `Insufficient stock. Current Level: ${item.stockLevel}` });
      }
      item.stockLevel -= qty;
    }

    // Append movement record
    item.movements.push({
      type,
      quantity: qty,
      reason: reason || '',
      date: new Date(),
      userId: req.user._id,
    });

    // Save
    const updatedItem = await item.save();

    let lowStockAlert = false;
    if (updatedItem.stockLevel <= updatedItem.minStockLevel) {
      lowStockAlert = true;
    }

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADJUST_INVENTORY_STOCK',
      details: `${type}ed ${qty} items from ${item.itemName}`,
      oldValues,
      newValues: updatedItem,
    });

    res.status(200).json({
      message: 'Stock updated successfully.',
      item: updatedItem,
      lowStockAlert,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getInventoryItems,
  createInventoryItem,
  adjustInventoryStock,
};
