# IoC Container for typescript
This is a lightweight annotation-based dependency injection container for typescript.

It can be used on browser or on node.js server code.

## Basic Usage

```typescript
import AutoWired = IoC.AutoWired;
import Inject = IoC.Inject;

@AutoWired
class PersonDAO {
  @Inject
  restProxy: PersonRestProxy;
}
```

That's it. You can just call now:

```typescript
let personDAO: PersonDAO = new PersonDAO();
```

And the dependencies will be resolved.

You can also inject constructor parameters, like:

```typescript
@AutoWired
class PersonService {
  private personDAO: PersonDAO;
  constructor( @Inject personDAO: PersonDAO ) {
    this.personDAO = personDAO;
  }
}
```

and then, if you make an injection to this class, like...

```typescript
@AutoWired
class PersonController {
  @Inject
  private personService: PersonService;
}
```

The container will create an instance of PersonService that receives the PersonDAO from the container on its constructor.
But you still can call:

```typescript
let personService: PersonService = new PersonService(myPersonDAO);
```

And pass your own instance of PersonDAO to PersonService.

Note that any type that have a constructor can be injected, not only the types that you decorate with @AutoWired.

```typescript
@AutoWired
class PersonController {
  @Inject
  private personService: PersonService;

  @Inject
  creationTime: Date;
}
```

## Inheritance

You don't have to do anything special to work with sub-types.

```typescript
@AutoWired
class abstract BaseDAO {
  @Inject
  creationTime: Date;
}

@AutoWired
class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

@AutoWired
class ProgrammerDAO extends PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;
}
```

Will work as expected.

## Scopes

You can use scopes to manage your instances as:

```typescript
@AutoWired 
@Singleton 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}

@AutoWired
class PersonController {
  @Inject
  private personService: PersonService;

  @Inject
  creationTime: Date;
}
```

So, we can create a lot of PersonController instances, but all of them will share the same singleton instance of PersonService

```typescript
let controller1: PersonController = new PersonController();
let controller2: PersonController = new PersonController();

```

We have two pre defined scopes (Scope.Singleton and Scope.Local), but you can define your own custom Scope. You just have to implements the Scope abstract class;

```typescript
class MyScope extends Scope { 
  resolve(iocProvider:Provider, source:Function) {
    alert('created by my custom scope.')
    return iocProvider.get();
  }
}
@AutoWired
@Scoped(MyScope) 
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

## Providers

Providers can be used as a factory for instances created by the IoC Container.

```typescript
const personProvider: Provider = { 
  get: () => { return new PersonService(); }
};
@AutoWired
@Scoped(MyScope) 
@provided(personProvider)
class PersonService {
  @Inject
  private personDAO: PersonDAO;
}
```

TODO: AsyncProviders are under development...using Promises

## Providing implementation for base classes
It is possible to tell the container to use one class as the implementation for a super class or interface. 

```typescript
@AutoWired
class PersonDAO extends BaseDAO {
  @Inject
  private personRestProxy: PersonRestProxy;
}

@AutoWired
@Provides (PersonDAO)
class ProgrammerDAO extends PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;
}
```

So, everywhere you inject a PersonDAO will receive a ProgrammerDAO instance instead. However, is still possible to create PersonDAO instances through its constructor, like:

```typescript
// a personDAO instance will be returned, with its dependecies resolved by container
let personDAO: PersonDAO = new PersonDAO(); 
```

## Direct Container interation 
Our intention is configure everything only using annotations, but you can interact direct with the IoC Container:

```typescript
// it will override any annotation configuration
Container.bind(PersonDAO).to(ProgrammerDAO).scope(Scope.Local); 

// that will make any injection to Date to return 
// the same instance, created when the first call is executed.
Container.bind(Date).to(Date).scope(Scope.Singleton); 
```

## A note about classes and interfaces

Typescript interfaces only exists at development time, to ensure type checkings. When compiled, they generates nothing to runtime code.
It means that is not possible to use interfaces as the type of a property being injected. There is no runtime information that could allow any reflection on interface type. Take a look at https://github.com/Microsoft/TypeScript/issues/3628 for more information about this.

So, this is not supported:

```typescript
interface PersonDAO {
  get(id: string): Person;
  // some methods here.
}

@AutoWired
@Provides (PersonDAO) // NOT SUPPORTED
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

@AutoWired
class PersonService {
  @Inject // NOT SUPPORTED
  private personDAO: PersonDAO;
}
```
However there is no reason for panic. Typescript classes are much more than classes. It could have the same behavior that interfaces on other languages.

So it is possible to define an abstract class and then implement it as we do with interfaces:

```typescript
abstract class PersonDAO {
  abstract get(id: string): Person;
  // some methods here.
}

@AutoWired
@Provides (PersonDAO) // It works
class ProgrammerDAO implements PersonDAO {
  @Inject
  private programmerRestProxy: PersonRestProxy;

  get(id: string): Person
  {
      // get the person and return it...
  }
}

@AutoWired
class PersonService {
  @Inject // It works
  private personDAO: PersonDAO;
}
```
The abstract class in this example, has exactly the same semantic that the typescript interface on the previous example. The only difference is that it generates type information into the runtime code, making possible to implement some reflection on it.

## Restrictions
- Circular injections are not supported
- You can only inject types that are already defined into your file. It can be solved by a @LazyInject on future releases
- You can still create new instances of classes in singleton scopes. The singleton instance is returned only when requested to the Container, while processing @Inject annotations... It is possible (I am not sure it is good) to change the Object constructor to throw a TypeError when you call directly new MySingletonType(); Accept suggestions on this.
