using ticketdesk from '../db/schema';

service TicketService {
  entity Users   as projection on ticketdesk.Users excluding { passwordHash };
  entity Assets  as projection on ticketdesk.Assets;
  entity Tickets as projection on ticketdesk.Tickets;

  type AuthUser {
    ID       : UUID;
    username : String;
    name     : String;
    role     : String;
  }

  type AuthResponse {
    token : String;
    user  : AuthUser;
  }

  action register(username: String, password: String, name: String) returns AuthResponse;
  action login(username: String, password: String)                  returns AuthResponse;

  action approveTicket(ID: UUID, comment: String)    returns Tickets;
  action rejectTicket(ID: UUID, comment: String)     returns Tickets;
  action requestRevision(ID: UUID, comment: String)  returns Tickets;
  action resubmitTicket(ID: UUID, description: String) returns Tickets;
}
