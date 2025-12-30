-- Custom SQL migration file, put your code below! --
INSERT INTO attendance_statuses (id, team_id, name, color, system_flag) VALUES
('01KDQ74JGR8N49PSPE09VKKZWV', NULL, '回答待ち', '#9CA3AF', true),
('01KDQ78J5Q660TYS0T6NH0YGQF', NULL, '回答不要', '#9CA3AF', true),
('01KDQ74JGWWWDKEBDDWRP50NTG', NULL, '欠席', '#EF4444', true),
('01KDQ74JGWNHRSW1967115GN2D', NULL, '出席', '#22C55E', true),
('01KDQ74JGW5YBH9XCR1TH67PAW', NULL, '遅刻', '#EAB308', true);
