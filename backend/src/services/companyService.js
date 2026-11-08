import { Company } from '../models/Company.js';
import { AuditLog } from '../models/AuditLog.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

/**
 * Lấy thông tin hồ sơ doanh nghiệp & địa điểm GPS
 */
export const getCompanyProfile = async (companyId) => {
  const company = await Company.findById(companyId).select('name code settings.locations');
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }
  return company;
};

/**
 * Cập nhật tên công ty và thông tin doanh nghiệp (Chỉ CEO)
 */
export const updateCompanyProfile = async (companyId, data, currentUser) => {
  const update = {};
  if (data.name) update.name = data.name.trim();
  if (data.code) update.code = data.code.trim().toUpperCase();

  const company = await Company.findByIdAndUpdate(
    companyId,
    { $set: update },
    { new: true }
  ).select('name code settings.locations');

  return company;
};

/**
 * Lấy danh sách địa điểm GPS Geofencing của công ty
 */
export const getLocations = async (companyId) => {
  const company = await Company.findById(companyId).select('name code settings.locations settings.activeLocationId');
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const rawLocations = company.settings?.locations || [];
  const activeId = company.settings?.activeLocationId;

  return rawLocations.map((loc, idx) => {
    const locObj = loc.toObject ? loc.toObject() : { ...loc };
    const isPrimary = activeId ? locObj.locationId === activeId : (Boolean(locObj.isPrimary) || idx === 0);
    return {
      ...locObj,
      isPrimary,
    };
  });
};

/**
 * Thêm mới một địa điểm GPS Geofencing (Cho phép nhiều địa điểm)
 */
export const addLocation = async (companyId, data, currentUser) => {
  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const locationId = data.locationId || `loc_${Date.now().toString(36)}`;

  // Kiểm tra trùng lặp locationId
  const existingLoc = company.settings?.locations?.find((loc) => loc.locationId === locationId);
  if (existingLoc) {
    const error = new Error(`Mã địa điểm ${locationId} đã tồn tại trong công ty`);
    error.statusCode = 409;
    throw error;
  }

  const isFirstLocation = !company.settings?.locations || company.settings.locations.length === 0;
  const isPrimary = data.isPrimary !== undefined ? Boolean(data.isPrimary) : isFirstLocation;

  const newLocation = {
    locationId,
    name: data.name,
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radiusMeters || 100,
    isPrimary,
  };

  if (isPrimary) {
    // Đặt làm primary -> reset các location khác
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'settings.locations.$[].isPrimary': false,
          'settings.activeLocationId': locationId,
        },
      }
    );
  }

  // Thêm vào danh sách locations (nhiều địa điểm)
  await Company.updateOne(
    { _id: companyId },
    { $push: { 'settings.locations': newLocation } }
  );

  // Ghi AuditLog kiểm toán
  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser.id,
    action: AUDIT_ACTIONS.UPDATE_COMPANY_SETTINGS,
    details: {
      operation: 'ADD_GPS_LOCATION',
      location: newLocation,
    },
  });

  return newLocation;
};

/**
 * Cập nhật một địa điểm GPS Geofencing
 */
export const updateLocation = async (companyId, locationId, data, currentUser) => {
  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const existingLoc = company.settings?.locations?.find((loc) => loc.locationId === locationId);
  if (!existingLoc) {
    const error = new Error(`Không tìm thấy địa điểm ${locationId}`);
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};
  if (data.name !== undefined) updateFields['settings.locations.$[elem].name'] = data.name;
  if (data.latitude !== undefined) updateFields['settings.locations.$[elem].latitude'] = data.latitude;
  if (data.longitude !== undefined) updateFields['settings.locations.$[elem].longitude'] = data.longitude;
  if (data.radiusMeters !== undefined) updateFields['settings.locations.$[elem].radiusMeters'] = data.radiusMeters;

  await Company.updateOne(
    { _id: companyId },
    { $set: updateFields },
    { arrayFilters: [{ 'elem.locationId': locationId }] }
  );

  const updatedCompany = await Company.findById(companyId).select('settings.locations');
  const updatedLoc = updatedCompany.settings.locations.find((l) => l.locationId === locationId);

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser.id,
    action: AUDIT_ACTIONS.UPDATE_COMPANY_SETTINGS,
    details: {
      operation: 'UPDATE_GPS_LOCATION',
      locationId,
      updatedData: data,
    },
  });

  return updatedLoc;
};

/**
 * Xóa một địa điểm GPS Geofencing
 */
export const deleteLocation = async (companyId, locationId, currentUser) => {
  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const exists = company.settings?.locations?.some((loc) => loc.locationId === locationId);
  if (!exists) {
    const error = new Error(`Không tìm thấy địa điểm ${locationId}`);
    error.statusCode = 404;
    throw error;
  }

  await Company.updateOne(
    { _id: companyId },
    { $pull: { 'settings.locations': { locationId } } }
  );

  // Nếu xóa trúng địa điểm đang active, chuyển active sang địa điểm đầu tiên còn lại
  if (company.settings?.activeLocationId === locationId) {
    const remaining = (company.settings.locations || []).filter((l) => l.locationId !== locationId);
    const newActiveId = remaining.length > 0 ? remaining[0].locationId : null;
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'settings.activeLocationId': newActiveId,
        },
      }
    );
    if (newActiveId) {
      await Company.updateOne(
        { _id: companyId },
        { $set: { 'settings.locations.$[elem].isPrimary': true } },
        { arrayFilters: [{ 'elem.locationId': newActiveId }] }
      );
    }
  }

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser.id,
    action: AUDIT_ACTIONS.UPDATE_COMPANY_SETTINGS,
    details: {
      operation: 'DELETE_GPS_LOCATION',
      locationId,
    },
  });

  return { success: true, message: `Đã xóa địa điểm ${locationId} thành công` };
};

/**
 * Chọn địa điểm hiện tại (Active Location) cho toàn công ty, GPS & Kiosk
 * Chỉ HR_MANAGER và CEO được phép thực hiện
 */
export const setActiveLocation = async (companyId, locationId, currentUser) => {
  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const targetLoc = company.settings?.locations?.find((loc) => loc.locationId === locationId);
  if (!targetLoc) {
    const error = new Error(`Không tìm thấy địa điểm ${locationId}`);
    error.statusCode = 404;
    throw error;
  }

  // 1. Reset toàn bộ isPrimary: false, lưu activeLocationId
  await Company.updateOne(
    { _id: companyId },
    {
      $set: {
        'settings.locations.$[].isPrimary': false,
        'settings.activeLocationId': locationId,
      },
    }
  );

  // 2. Bật isPrimary: true cho location được chọn
  await Company.updateOne(
    { _id: companyId },
    {
      $set: {
        'settings.locations.$[elem].isPrimary': true,
      },
    },
    { arrayFilters: [{ 'elem.locationId': locationId }] }
  );

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser.id,
    action: AUDIT_ACTIONS.UPDATE_COMPANY_SETTINGS,
    details: {
      operation: 'SET_ACTIVE_LOCATION',
      locationId,
      locationName: targetLoc.name,
    },
  });

  return {
    success: true,
    activeLocationId: locationId,
    location: {
      ...(targetLoc.toObject ? targetLoc.toObject() : targetLoc),
      isPrimary: true,
    },
  };
};

/**
 * Nạp / Đặt lại địa điểm «Phòng Bảo vệ ĐATN» phục vụ Hội đồng chấm thi
 */
export const seedDefenseLocation = async (companyId, currentUser) => {
  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const defenseLocation = {
    locationId: 'loc_defense',
    name: 'Phòng Bảo vệ ĐATN - Hội đồng K23',
    latitude: 21.0362,
    longitude: 105.7829,
    radiusMeters: 100,
    isPrimary: true,
  };

  const existingLoc = company.settings?.locations?.find((loc) => loc.locationId === 'loc_defense');
  if (existingLoc) {
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'settings.locations.$[].isPrimary': false,
          'settings.activeLocationId': 'loc_defense',
          'settings.locations.$[elem].name': defenseLocation.name,
          'settings.locations.$[elem].latitude': defenseLocation.latitude,
          'settings.locations.$[elem].longitude': defenseLocation.longitude,
          'settings.locations.$[elem].radiusMeters': defenseLocation.radiusMeters,
          'settings.locations.$[elem].isPrimary': true,
        },
      },
      { arrayFilters: [{ 'elem.locationId': 'loc_defense' }] }
    );
  } else {
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'settings.locations.$[].isPrimary': false,
          'settings.activeLocationId': 'loc_defense',
        },
        $push: { 'settings.locations': defenseLocation },
      }
    );
  }

  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser.id,
    action: AUDIT_ACTIONS.UPDATE_COMPANY_SETTINGS,
    details: {
      operation: 'SEED_DEFENSE_LOCATION',
      location: defenseLocation,
    },
  });

  return defenseLocation;
};
