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
  const company = await Company.findById(companyId).select('name code settings.locations');
  if (!company) {
    const error = new Error('Doanh nghiệp không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return company.settings?.locations || [];
};

/**
 * Thêm mới một địa điểm GPS Geofencing
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

  const newLocation = {
    locationId,
    name: data.name,
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radiusMeters || 100,
  };

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
    locationId: 'loc_demo',
    name: 'Văn phòng Chi nhánh Cầu Giấy',
    latitude: 21.0362,
    longitude: 105.7829,
    radiusMeters: 100,
  };

  const existingIndex = company.settings?.locations?.findIndex(
    (l) => l.locationId === 'loc_demo' || l.name.includes('Phòng Bảo vệ') || l.name.includes('Chi nhánh Cầu Giấy')
  );

  if (existingIndex !== undefined && existingIndex >= 0) {
    // Cập nhật lại tọa độ chuẩn
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'settings.locations.$[elem]': defenseLocation,
        },
      },
      { arrayFilters: [{ 'elem.locationId': company.settings.locations[existingIndex].locationId }] }
    );
  } else {
    // Thêm mới
    await Company.updateOne(
      { _id: companyId },
      { $push: { 'settings.locations': defenseLocation } }
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
