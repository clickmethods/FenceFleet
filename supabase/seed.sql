insert into customers (name, contact_name, email, phone, billing_address, delivery_address, credit_limit) values
('Rocky Mtn Builders','Jake Torres','jake@rmbuilders.com','303-555-0141','1200 Broadway, Denver CO','Same','15000'),
('Summit Events Co','Lena Park','lena@summitevents.com','720-555-0177','88 Speer Blvd, Denver CO','Varies by event','8000'),
('Front Range Concrete','Dan O''Neil','ops@frconcrete.com','303-555-0102','450 Santa Fe Dr, Denver CO','Same','20000');

insert into inventory_items (unit_number, category, serial_number, location, status, daily_rate) values
('PNL-0001','panel','SN-A1001','Yard','available',1.25),
('PNL-0002','panel','SN-A1002','Yard','available',1.25),
('PNL-0003','panel','SN-A1003','Yard','available',1.25),
('PNL-0004','panel','SN-A1004','Yard','soft_down',1.25),
('PST-0001','post','SN-B2001','Yard','available',0.50),
('PST-0002','post','SN-B2002','Yard','available',0.50),
('GTE-0001','gate','SN-C3001','Yard','available',3.00),
('GTE-0002','gate','SN-C3002','Yard','available',3.00),
('BSE-0001','base','SN-D4001','Yard','available',0.35),
('WSC-0001','windscreen','SN-E5001','Yard','available',0.75);
