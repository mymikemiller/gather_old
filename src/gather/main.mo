import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Int32 "mo:base/Nat32";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Random "mo:base/Random";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Trie "mo:base/Trie";
import Types "types";

actor Gather {
  public type User = Types.User;
  public type Profile = Types.Profile;
  public type Error = Types.Error;
  type StableGather = Types.StableGather;
  type GatheringInfo = Types.GatheringInfo;
  type Gathering = Types.Gathering;

  private func key(x: Principal) : Trie.Key<Principal> {
    return { key = x; hash = Principal.hash(x) };
  };

  private func asStable() : StableGather = {
    // Map the (Principal, User) pairs from the unstable users trie into a
    // stable array of Users (the User type contains the Principal, so the trie
    // can be recreated on postupgrade)
    userEntries = 
      Iter.toArray(
        Iter.map<(Principal, User), User>(
          Trie.iter(users), func pair { pair.1 }
        )
      );

    // Similarly, map the (Nat, Gathering) pairs from the unstable gatherings
    // HashMap into a stable array of Gatherings (the Gathering type contains
    // the id, so the HashMap can be recreated on postupgrade)
    gatheringEntries = 
      Iter.toArray(
        Iter.map<(Nat, Gathering), Gathering>(
          gatherings.entries(), func pair { pair.1 }
        )
      );
  };

  // This pattern uses `preupgrade` and `postupgrade` to allow `users` and
  // `gatherings` to be stable even though Trie and HashMap are not. See
  // https://sdk.dfinity.org/docs/language-guide/upgrades.html#_preupgrade_and_postupgrade_system_methods
  
  // Only used to store data during upgrades
  stable var stableGather: StableGather = { 
    userEntries = []; 
    gatheringEntries = []; 
  };

  // There is no Trie.fromArray, so we use a List as an intermediary
  var users : Trie.Trie<Principal, User> = Trie.fromList<Principal, User>(
    null,
    List.fromArray(
      Array.map<User, (Trie.Key<Principal>, User)>(
        stableGather.userEntries,
        func (user: User) : (Trie.Key<Principal>, User) {
          return (
            key(user.principal),
            user
          );
        }
      )
    ),
    0
  );

  var gatherings: HashMap.HashMap<Nat, Gathering> = HashMap.fromIter<Nat, Gathering>(
    Iter.fromArray(
      Array.map<Gathering, (Nat, Gathering)>(
        stableGather.gatheringEntries, func gathering {(gathering.id, gathering)}
      )
    ), 1, Nat.equal, Hash.hash);

  system func preupgrade() {
      stableGather := asStable();
  };

  system func postupgrade() {
      stableGather := { userEntries=[]; gatheringEntries=[]; };
  };

  public func getAllUsers(): async Trie.Trie<Principal, User> {
    return users;
  };

  private func getUser(principal: Principal) : ?User {
    return Trie.find(
      users,             // Target trie
      key(principal),    // Key
      Principal.equal,   // Equality checker
    );
  };

  // Update the profile associated with the given principal, returning the new
  // user. A null return value means we did not find a user to update. 
  private func _updateUser(principal: Principal, newProfile : Profile) : async ?User {
    // Associate user profile with their principal
    let newUser: User = {
      principal = principal;
      profile = newProfile;
    };

    switch (getUser(principal)) {
      // Do not allow updates to users that haven't been created yet
      case null {
        return null;
      };
      case (? existingUser) {
        users := Trie.replace(
          users,
          key(principal),
          Principal.equal,
          ?newUser
        ).0;
        return Option.make(newUser);
      };
    };
  };

  // Public Application Interface

  // Create a user
  public shared(msg) func createUser(newProfile: Profile) : async Result.Result<(), Error> {
    // Get caller principal
    let callerId = msg.caller;

    // Reject the AnonymousIdentity, which always has the value of "2vxsx-fae".
    // The AnonymousIdentity is one that any not-logged-in browser is, so it's
    // useless to have a user with that value.
    if(Principal.toText(callerId) == "2vxsx-fae") {
      return #err(#NotAuthorized);
    };

    //Associate user with their Principal
    let newUser: User = {
      principal = callerId;
      profile = newProfile;
    };

    let (newUsers, existingUser) = Trie.put(
      users,             // Target trie
      key(callerId),     // Key
      Principal.equal,   // Equality checker
      newUser
    );

    // If there is an original value, do not update
    switch(existingUser) {
      // If there are no matches, update users trie
      case null {
        users := newUsers;
        #ok(());
      };
      // Matches pattern of type - opt User
      case (? v) {
        #err(#AlreadyExists);
      }
    };
  };

  // Read user
  public shared(msg) func readUser() : async Result.Result<User, Error> {
    // Get caller principal
    let callerId = msg.caller;

    // Reject the AnonymousIdentity
    if(Principal.toText(callerId) == "2vxsx-fae") {
      return #err(#NotAuthorized);
    };

    let user = getUser(callerId);
    return Result.fromOption(user, #NotFound);
  };

  // Update user (the logged-in user who caused this message to be called)
  public shared(msg) func updateUser(profile : Profile) : async Result.Result<(), Error> {
    // Get caller principal
    let callerId = msg.caller;

    // Reject the AnonymousIdentity
    if(Principal.toText(callerId) == "2vxsx-fae") {
      return #err(#NotAuthorized);
    };

    let newUser = await _updateUser(callerId, profile);

    switch (newUser) {
      case null {
      // Notify the caller that we did not find a user to update
        #err(#NotFound);
      };
      case (? user) {
        #ok(());
      };
    };
  };

  // Delete user
  public shared(msg) func deleteUser() : async Result.Result<(), Error> {
    // Get caller principal
    let callerId = msg.caller;

    // Reject the AnonymousIdentity
    if(Principal.toText(callerId) == "2vxsx-fae") {
      return #err(#NotAuthorized);
    };

    switch (getUser(callerId)) {
      // Do not allow updates to users that haven't been created yet
      case null {
        #err(#NotFound);
      };
      case (? user) {
        users := Trie.replace(
          users,
          key(callerId),
          Principal.equal,
          null              //Replace specified user with null
        ).0;
        #ok(());
      };
    };
  };

  /// Functions not related to user management: ///

  public func getAllGatherings(): async [Gathering] {
    return Iter.toArray(gatherings.vals());
  };

  public func addGathering(info: GatheringInfo): async Gathering {
    var existingGathering: ?Gathering = null;
    loop {
      var id = await randomNumber();
      existingGathering := gatherings.get(id);
      switch(existingGathering) {
          case null {
            // We're free to use the random id we generated.
            let newGathering: Gathering = {
              id = id;
              info = info;
            };
            gatherings.put(id, newGathering);
            return newGathering;
          };
          // Loop again if existingGathering exists
          case (? g) {};
      };
    } while Option.isNull(existingGathering);
    Debug.trap("Failed to generate usable id for new Gathering.");
  };

  var randomState0: Nat32 = 1;
  var randomState1: Nat32 = 2;

  // from https://gist.github.com/chchrist/927b0c8ffe36a52b11522f470b81f216
  func xorshift128plus(): Nat {
      var s1 = randomState0;
      var s0 = randomState1;

      randomState0 := s0;

      s1 ^= s1 << 23;
      s1 ^= s1 >> 17;
      s1 ^= s0;
      s1 ^= s0 >> 26;
      randomState1 := s1;
      
      return Nat32.toNat(randomState0) + Nat32.toNat(randomState1);
  };

  func randomNumber() : async Nat {
      return xorshift128plus();
  }


};
