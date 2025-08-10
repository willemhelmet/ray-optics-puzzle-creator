# **Brilliant Take-Home Written Component**

## **Now that you've had a chance to implement it, are there different features you would have prioritized, knowing what you know now?**

Given the four-hour time constraint, I prioritized delivering a functional experience centered on a single, core interaction: “touch areas” that students could toggle to answer questions.  
	With more time, I would have prioritized features that offer a more hands-on approach for learners. For example, I initially planned to include dynamic sliders that could control the position of the triangle object. This would have provided a more intuitive grasp on how virtual images move in relation to their real-world source. However, implementing the authoring controls proved too complex for the project's scope.  
	I also cut several ideas for the visuals of the interactable. My original concept used an asymmetrical rabbit character (a nod to “Alice in Wonderland”) instead of a simple triangle. An asymmetrical shape is a much better tool for demonstrating how images flip in a mirror. I also planned on showing reflectable text labels, which would offer a real-world example of reflection.  
	Finally, I decided to de-scope a responsive preview pane. I wanted to add this in order for the subject matter expert to ensure that their puzzle designs would be consistent across a wide variety of device types.

## **How could your interactive be extended to cover more concepts in optics?**

The submitted interactive is built upon a simplified geometric calculation model. While this approach is ideal for flat mirrors placed at 90-degree angles, there is still a lot to be desired. To cover more concepts in optics, a more robust engine would need to be created. For instance, a ray-marching algorithm would allow us to simulate the path of light as it bounces and bends. This approach would unlock the ability to teach a much wider range of concepts such as concave and convex mirrors, lenses, refraction, reflections off of specular and diffuse surfaces, and more complex mirror setups where mirrors are placed at arbitrary angles.

## **What parts of your interactive could be useful in other areas of STEM? Give a few examples.**

The interactive’s reflection engine can be used to model how sound waves bounce in a room. Instead of mirrors, we could have concrete or fabric that attenuate the sound’s signal at differing amounts. In robotics, LiDAR systems use reflection to map a 3D environment; one could imagine an interactive where we program a robot to learn about their environment through a LiDAR scan, and then program it to navigate around walls and hazards. This engine could also be used to build interactives to describe 2D vector math. Lastly, for a fun application, this engine can model a game of billiards, helping aspiring pool sharks learn the geometric angles needed to sink a shot off the rails.

## **Please briefly describe your use of AI to produce the deliverable.**

I used AI tools throughout the development of this take-home project. For planning, I worked closely with a chat-based LLM tool to write a comprehensive specification that describes the design of the experience, the API, the data model, the layout of all the screens in the app, and the layout of the JSON used to save and load puzzles. During the take-home, I used a CLI-based LLM tool to create the features following the spec. I relied heavily on “Plan Mode” to ensure the LLM was going in the right direction, and I could provide feedback to update the plan if I noticed they were going off track.