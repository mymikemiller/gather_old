import Nat "mo:base/Nat";

module {
  // Used to store the contents of the Gather canister in stable types
  // between upgrades
  public type StableGather = {
      userEntries: [User];
      gatheringEntries: [Gathering];
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
    gatherings_created: [Gathering];
    gatherings_responded: [Gathering];
  };

  public type GatheringInfo = {
    title: Text;
    description: Text;
    datetime: Text;
    address: Text;
    items: [(Item, Nat)]; // (Item, Number of item originally needed)
    responses: [(User, Response)];
  };

  public type Gathering = {
    id: Nat;
    info: GatheringInfo;
  };

  public type Item = {
    name: Text;
    description: Text;
  };

  public type Response = {
    attending: Bool;
    items: [(Item, Nat)]; //(Item, number bringing)
    comment: ?Text;
  };

  public type Error = {
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
  };
}
