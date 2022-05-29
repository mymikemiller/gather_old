import Map "mo:base/HashMap";
import Nat "mo:base/Nat";

module {
  // Used to store the contents of the Gather canister in stable types
  // between upgrades
  public type StableGather = {
      userEntries: [User];
  };

  public type User = {
    principal: Principal;
    profile: Profile;
  };

  public type Profile = {
    name: Text;
    email: Text;
    phone: Text;
    picture: Text;
    events_created: [Gathering];
    events_responded: [Gathering];
  };

  public type Gathering = {
    title: Text;
    description: Text;
    datetime: Text;
    address: Text;
    items: [(Item, Nat)]; // (Item, Number of item originally needed)
  };

  public type Item = {
    name: Text;
    description: Text;
  };

  public type Response = {
    attending: Bool;
    items: [Item];
    comment: ?Text;
  };

  public type Error = {
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
  };
}