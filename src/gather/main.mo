import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Types "types";

actor Gather {
  public type User = Types.User;
  public type Profile = Types.Profile;
  public type Error = Types.Error;
  type StableGather = Types.StableGather;

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
  };

  // This pattern uses `preupgrade` and `postupgrade` to allow `users` to be
  // stable even though Trie is not. See
  // https://sdk.dfinity.org/docs/language-guide/upgrades.html#_preupgrade_and_postupgrade_system_methods
  
  // Aplication state
  stable var stableGather: StableGather = { userEntries = []; };

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

  system func preupgrade() {
      stableGather := asStable();
  };

  system func postupgrade() {
      stableGather := { userEntries=[]; };
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
  private func updateUser(principal: Principal, newProfile : Profile) : async ?User {
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
  public shared(msg) func create(newProfile: Profile) : async Result.Result<(), Error> {
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
  public shared(msg) func read() : async Result.Result<User, Error> {
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
  public shared(msg) func update(profile : Profile) : async Result.Result<(), Error> {
    // Get caller principal
    let callerId = msg.caller;

    // Reject the AnonymousIdentity
    if(Principal.toText(callerId) == "2vxsx-fae") {
      return #err(#NotAuthorized);
    };

    let newUser = await updateUser(callerId, profile);

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
  public shared(msg) func delete() : async Result.Result<(), Error> {
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
};
