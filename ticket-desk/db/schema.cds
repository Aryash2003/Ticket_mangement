namespace ticketdesk;

entity Users {
  key ID       : UUID;
  username     : String(50) @mandatory;
  passwordHash : String(200);
  name         : String(100);
  role         : String(10) enum { ADMIN; USER; } default 'USER';
  tickets      : Association to many Tickets on tickets.raisedBy = $self;
}

entity Assets {
  key ID       : UUID;
  assetTag     : String(20);
  assetType    : String(50);
  tickets      : Composition of many Tickets on tickets.asset = $self;
}

entity Tickets {
  key ID          : UUID;
  title           : String(150) @mandatory;
  description     : String(1000);
  status          : String(20) enum { PENDING; APPROVED; REJECTED; REVISION_REQUESTED; } default 'PENDING';
  adminComment    : String(1000);
  raisedBy        : Association to Users;
  asset           : Association to Assets;
  createdAt       : Timestamp @cds.on.insert: $now;
  updatedAt       : Timestamp @cds.on.insert: $now @cds.on.update: $now;
}
