'use strict';

exports.up = (pgm) => {
  pgm.createType('compliance_status_enum', ['pass', 'fail']);
  pgm.createType('scan_mode_enum', ['realtime', 'batch', 'full_audit']);

  pgm.createTable('asset_audits', {
    asset_id: { type: 'uuid', primaryKey: true },
    filename: { type: 'text', notNull: true },
    compliance_status: { type: 'compliance_status_enum', notNull: true },
    violation_type: { type: 'text[]', notNull: true, default: '{}' },
    brand: { type: 'text' },
    campaign: { type: 'text' },
    channel: { type: 'text' },
    format: { type: 'text' },
    language: { type: 'text' },
    market: { type: 'text' },
    agency: { type: 'text' },
    upload_date: { type: 'timestamptz' },
    scan_mode: { type: 'scan_mode_enum', notNull: true },
    scanned_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createIndex('asset_audits', 'compliance_status');
  pgm.createIndex('asset_audits', 'brand');
  pgm.createIndex('asset_audits', 'campaign');
  pgm.createIndex('asset_audits', 'market');
  pgm.createIndex('asset_audits', 'agency');
  pgm.createIndex('asset_audits', 'scanned_at');
};

exports.down = (pgm) => {
  pgm.dropTable('asset_audits');
  pgm.dropType('scan_mode_enum');
  pgm.dropType('compliance_status_enum');
};
