# loudo-ds-core

Provides core interfaces and base classes for loud data structures,
as well as a mixin pattern for them.

## LEvent

The data structures provided by `loudo-ds` are _loud_, meaning they
can broadcast changes made to them to interested parties. Such changes
are represented by the `LEvent` class, which consists of three fields:

* `cleared`: This is set to true if the entire data structure was cleared.
In that case, `removed` will not be present.
* `removed`: An iterable of elements that were removed, as well as the
index they were removed from (if the data structure is indexed.)
* `added`: An iterable of elements that were added, as well as the index
they were added at (if the data structure is indexed.)

It is possible for both `removed` and `added` to be present in the same
event. In that case, a listener should process the `removed` iterable
first, then process the `added` iterable.

It's also possible for both `cleared` and `added` to be present in the
same event. That occurs during bulk operations that necessarily alter
the entire data structure, such as sorting an array.

## Event Handlers

An event handler is simply a function that takes an `LEvent`. You can
register an event handler via a `DataStructure` instance's `hear`
method, and you can unregister via the `unhear` method. You can use
the `hearing` method to determine if a particular event handler is
registered or not.
