---
title: Collapsible header using the React Native Animated API
date: "2021-05-21T08:41:19.464Z"
description: "Create a collapsible header with a sticky bar on top of a scrollable list using the class components."
---

Here we're going to build an animated header that disappears when the user scrolls down the list and reappears when the user scrolls back upwards. Also, the header will have a sticky bar that will be there all the way around, no matter where the user is in the vertical list.

<!-- The gif-->

This is a pretty standard and commonly used effect in mobile apps. But we will take a slightly different approach in this post to achieve the desired result. **We take a look at the React Native source code!**
Since the `Animated` API methods used with the `useNativeDriver` option run on the native UI thread, they are not easily debugged. For instance, you can't see what exact value is generated per scroll value in the `interpolate` method.
And the `interpolate` or any other `Animated` method is just a black box to you without even enough documentation on it.
So in this post, we will deep dive into the algorithms used under the hoods that generate these animated values. At least seeing how our configs and options are used is a step forward in writing animation code!
And we will also review the general meaning of animation functions we use.
Since most of them are generic graphics techniques, if you're not familiar with them beforehand, writing animation would be a more daunting experience.
In other words, in this post, apart from the actual tutorial on a specific animation effect, we will go over the approach on how to deal with implementing a new and unfamiliar animation.

So without further ado, let's start the tutorial:

## Container Component

Here we will go with a classic approach. Which is to put the header component out of the scroll container and position it with `absolute` style property.

This will cause an overlap between the header and scrollable content. So the `Animated.ScrollView` will need a:

```javascript:
contentContainerStyle={{paddingTop: this.state.headerHeight}}
```

Therefor we need to measure the `headerHeight` as well. For this to happen, we will pass an `onLayout` callback function to the header component and will use it inside that component later on:

```js
onHeaderLayout = (headerHeight) => {
  this.setState({
     headerHeight,
  });
};
// A bunch code we don't need yet
render() {
  // A bunch of components and props again not needed yet...
  <CollapsibleHeader
  // A ton of props we don't care about yet...
  onLayout={this.onHeaderLayout}
  ..
  />
}
```

And to trace the scroll, we will use this function:

```js
onScroll={Animated.event(
  [{nativeEvent: {contentOffset: {y: this.scrollY}}}],
  {useNativeDriver: true},
)}
```

Which `scrollY` is an `Animated` value defined at the top of the container component:

```js
this.scrollY = new Animated.Value(0)
```

## Collapsible Header Component

Our `CollapsibleHeader` component will need to know about the scroll value to work. Therefore we will add this prop to the component which is in the container component:

```js
scrollY={this.scrollY}
```

Remember the `onLayout` callback from the previous section? Here's where we're going to define the function itself and fetch the required values and eventually inform the parent about it:

```js
onLayout = ({
  nativeEvent: {
    layout: {y, height},
  },
}) => {
  this.setState({
    layoutHeight: height,
    clampedScroll: Animated.diffClamp(this.props.scrollY, 0, height),
  });
  this.props.onLayout && this.props.onLayout(height);
};
```

So a lot of stuff is going on here. Let's go over them one by one. First, this function will be passed as a prop to the wrapper `Animated.View` component. Which is used to navigate the animated transformation while scrolling the content.

Next, we're fetching the height of the header component and putting it in the state to use later for transformation.

Next is one of the crucial steps of achieving our desired animated effect: The `diffClamp`.

To understand what does this `Animated` function does, let's start with clamping itself.

> In computer graphics, **clamping** is the process of limiting a position to an area. In general, clamping is used to restrict a value to a given range.
> _Wikipedia_

The pseudocode for clamping is more intuitive to understand:

```c:
function clamp(x, min, max):
    if (x < min) then
        x = min
    else if (x > max) then
        x = max
    return x
```

In our case, `x` would be the `scrollY` value, obviously. But this simple clamping is not enough.
Right now, we're just limiting the exact `scrollY` value. This would be desirable if we only wanted to display the header on the top of the page. And then hide it when the user scrolls past the header height.
But what we want is to reappear the header when the user drags downwards and goes up on the list.
In a way, we can say we don't care about the raw `scrollY` value. We care about how much it's changed compared to a moment ago.
This is what `diffClamp` does for us. This function internally subtracts the two continuous `scrollY` values and feeds them to the clamp function. So this way, we will always have a value between `0` and `headerHeight` no matter where on the list.

Phew! And clamping is done! Let's move forward to actually using what we've calculated. Now we're in the `render` method finally.

```js
render() {
    const {clampedScroll, layoutHeight, stickyHeight} = this.state;
    const translateY = clampedScroll
      ? clampedScroll.interpolate({
          inputRange: [0, layoutHeight - stickyHeight],
          outputRange: [0, -(layoutHeight - stickyHeight)],
          extrapolateRight: 'clamp',
        })
      : 0;
}
```

So let's go over stuff one by one again. Shall we?
In this step, we're using another `Animated` function. Which is `interpolate`, another general graphics technique.

> interpolation is inbetweening or filling in frames between the keyframes.
> _Wikipedia_

You can think of interpolation as a mapping function. We declare the starting and ending values (the `inputRange`) and then what we want to convert these values into (the `outputRange`).

That's how the React Native doc puts it:

> The `interpolate()` function allows input ranges to map to different output ranges. By default, it will extrapolate the curve beyond the ranges given, but you can also have it clamp the output value.

The options used for interpolation are straightforward for a good part. We have defined in which ranges of `scrollY` value we want an interpolation and what we want the value to be mapped into. The range we want is the top of the `ScrollView` till the header height. But we don't want to completely hide the header. We want to display a sticky bar all the time. So we're going to subtract the sticky height value out of our `layoutHeight`.

Now let's talk about the chosen range. We start the input range from `0` since we want the calculations to start at the top of the list when no motion is made yet. And we stop the range when the user scrolls about the height of the header. Since we want to display the sticky bar all the way around, we're subtracting the height of the bar here.
To get the sticky bar height, we've got several solutions. The solution used here exposes the `setStickyHeight` method to the parent, and the parent passes it to the sticky bar component. Then this function gets called in the Navbarcomponent's `onLayout` function eventually and gives us the height.

Another approach would be using `componentDidUpdate` in `CollapsibleHeader` component and call `setStickyHeight` when the `stickyHeight` prop is available through the parent.

<!--Put the code -->

The output range, in our case, is just reversing the value. Since we want to hide the header when the user scrolls down, the `scrollY` value increases. And we want to display the header as soon as the user scrolls up. (therefore decreasing the `scrollY` value).

Another approach for the desired output range would be the Animated.multiply()function. As such:

```js
const translateY = clampedScroll
    ? clampedScroll.multiply(layoutHeight - stickyHeight, -1)
    : 0;
```

<!-- Test and find out how to handle the clamp -->

The extrapolation stated here is the final config we need to set up since we don't want to *extrapolate the curve beyond the ranges given* as stated above in the doc definition. This will make our sticky bar go away when scrolling down the list. We only care about the extrapolateRight in our case. Since the problem appears when the `scrollY` value is beyond the `layoutHeight - stickyHeight`, which is the right side of the given range.
To understand this better let's take a look at the condition that caused this in the React Native source code:

```js
if (result > inputMax) {
  if (extrapolateRight === 'identity') {
    return result;
  } else if (extrapolateRight === 'clamp') {
    result = inputMax;
  } else if (extrapolateRight === 'extend') {
    // noop
  }
}
```

You see, when we set it to `clamp`, it gets limited to the `inputMax` value, which is the `layoutHeight - stickyHeight` in our code.

And that's it! Now our animated value is generated and it's ready to be used. All we need to do is to pass it in the `style` array, alongside the `onLayout` prop:

```js
return (
      <Animated.View
        style={[styles.container, {transform: [{translateY}]}]}
        onLayout={this.onLayout}>
        {this.props.children}
      </Animated.View>
    );
```

Also since we use the `absolute` positioning for the header component, we're going to use this container style:

```jsx
container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    zIndex: 10,
  },
```

## Sticky Bar Component

Now we're in the final step, which is writing the sticky bar component. This is an elementary component just to demonstrate the effect.
In our case, this component will be the child `<CollapsibleHeader>` component. As such:

```js
<TabBar onLayout={this.onStickyHeaderLayout} />
```

As you see we only need to pass the `onLayout` callback function of the parent. Which is similar to the one we've used in the first section:

```js
onStickyHeaderLayout = (stickyHeaderHeight) => {
    this.setState({
      stickyHeaderHeight,
    });
    this.header?.current?.setStickyHeight(stickyHeaderHeight);
  };
```

And in the second section, we've talked about the `setStickyHeight` function of the `<CollapsibleHeader>` and why we need it.

The main wrapper of the `<TabBar>` component needs an `onLayout` function which follows the same patterns:

```js
onViewLayout = ({
    nativeEvent: {
      layout: {height, y},
    },
  }) => {
    const {onLayout} = this.props;
    onLayout && onLayout(height, y);
  };
```

## And finally...

We're good. We should have a smooth appearing/disappearing animation effect on our header component using the `Animated` API.

