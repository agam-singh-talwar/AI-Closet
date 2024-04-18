# AI Clauset

Live at https://ai-clauset.vercel.app/

<br>

Introduction
--
Welcome to AI clauset, your personal helper to select your day to day outfits. We invite you to complete a little walkthrough below to see the key features of our application. It will show what our application is currently capable of as well as how it utilizes AI in its work.

**Please do the walkthough in the incognito window as some of the addons might block the fetches to AI.**

<br>

Walkthrough
--
- [Account Creation](#account-creation)
- [Adding Clothes (AI used)](#adding-clothes-AI-used)
- [Generate Outfit](#generate-outfit)
- [Weather Setup (AI used)](#weather-setup-AI-used)

<br>

# Account Creation
Let's start our journey with signup. On the Home page on the top left corner click SignUp button.
![signup](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/002d7c1d-8b66-4c80-bd3d-646140f9dbc9)

On the appeared form you are asked for "your name", "email" and "password". Fill out those fields with corresponding information and click "Create my account".

Mock examples of information that you can input:
- "Your name": "Alex"
- "Email": "alex@email.com"
- "Password": "12345"

After you have created account, you should see the main page of the application with your name on top.
![after-signup](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/5e9d8ea6-6d98-46cc-ad21-797c0d3730e4)

<br><br><br>

# Adding Clothes (AI used)
You won't see any outfits on the Home page as you don't have any clothes. Let's add some.
You have an option to click "+" button in the bottom right corner on the home page OR go to "[My Wardrobe](https://ai-clauset.vercel.app/wardrobe)" in the navbar and click "Add New Cloth" button at the bottom of the page.

Option 1 (Click "+" button):
![after-signup](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/4ac00ab6-5678-4b48-8640-67c6304d997a)

Option 2 (Click "Add New Cloth" button):
![add](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/e6e6ecdb-aaeb-4a90-82ac-b9197b6a877f)

In any case you will be presented with a modal asking you to enter cloth information.
All fields are required and you are asked to upload a cloth image, enter its name, enter an occasion for which you feel comfortable wearing this cloth and enter a temperature under which you feel comfortable wearing this cloth.

**AI USED:** You can witness the use of AI when you appload an image of an item.
After a small amount of time as you upload an image of a cloth, you will see that cloth type was identified. Note: auto detection only works for .png and .jpg images.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/9d710915-415b-471e-8959-10a04e174948" height="390">

The way we get this AI prediction:
- Step 1: Grab url of the uploaded image (once image is automatically uploaded to UploadCare service, so we grab this image's url that service).
- Step 2: Send URL to the prediction model.
- Step 3: Process the output object from the prediction model and set UI form input with get the tag name that has the highest probability.
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/f66cc6ba-b105-4be7-a062-555c67db2ac3)


If you need, you can find clothes mock information in "[Clothes Mock Information](#clothes-mock-information)" section at the bottom for a quick application test.
Fill out the rest of the information for the cloth and you will see that cloth has been added to your virtual wardrobe.

<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/99782320-6900-4834-a90b-0b7ecf9b090a" height="390">

<br><br><br>

# Generate Outfit
Great, you have 1 cloth added to your virtual wardrobe. That's a good start. An outfit requires to have 2 clothes (TOP and BOTTOM) for the same occassion. Therefore, let's add another cloth for the same occasion, so that we can see the first outfit.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/3dff06d2-0557-48bc-b261-2fb28d7afc97" height="350">
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/ae1ad3fd-ac5d-4460-977d-18e15e88b89e" height="350">

Now, return to the [home page](https://ai-clauset.vercel.app/). You can now see that we have a generated outfit for the occasion for which we have met the requirement of adding at least 1 top and 1 bottom cloth.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/8f085762-9cf9-4c03-a530-0f02dd556d78" height="390">

You are absolutely free to add multiple clothes (tops and bottoms) for the same occassion. Whenever you click "Re-Generate Outfits" button in the bottom left corner of the home page, application will select 1 top and 1 bottom out of the pool of clothes for the same occasion.

For instance, let's add another bottom item for the casual occasion.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/cee5ae77-f8b7-4c9e-b25a-f76faefc7115" height="350">
<br>
Now, there are 3 clothes in the virtual wardrobe.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/8256a573-6a90-41f5-9237-6d3a24181c04" height="350">
<br>
Now, whenever you click "Re-Generate Outfits" on the home page, Casual outfit might change and show you another bottom. The more clothes you have for the same occasion, the more likely the outfit will change for that occasion whenever you click "Re-Generate Outfits".
![regeneratebtn](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/61f8f0c2-b392-49c2-adb7-23122a2609e1)
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/40677b04-3a6e-435b-ae71-4f8d6cbc2ab2)

Let's continue and add clothes, so that we have another outfit for Formal occasion.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/f5add7da-281e-4636-a2b3-b3de7bcf299e" height="350">
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/b22fdb60-f606-4dfc-a019-24a4ac0235fc" height="350">

Our virtual wardrobe is getting larger!
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/6ccfc967-9d2f-49cf-8964-cb87e4c0c88c)

Now, go back to the Home page, where you can now witness another outfit for "Formal" occasion.
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/929f709e-a659-4d19-bf3e-55dfc9ccda67)

<br><br><br>

# Weather Setup (AI used)
Our application can help you make sure that your outfits match current weather conditions. All you have to do is enable your location and application will do everything for you!
<br>
Go to the "[My Account](https://ai-clauset.vercel.app/account)" page using navbar and click on "Detect" next to Location.
![detect](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/fbb3c5e4-5c20-466a-92df-4cb2f61e15e8)

You might be prompted to allow your location. Click "Allow" if you want to have outfits matched depending on current weater conditions.
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/c5c005fd-44b5-4ffc-8574-4d823f822991" height="150">

After you allow your location, you will see that location input was automatically filled. Enter your current password to confirm the changes and click "Update Account" button.
<br>
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/b0aeb229-8b17-4edc-b22a-2386ca065b16" height="350">

After you update account with your location, you can return back to the home page, where you can witness current weather conditions in your location on the right side.
<br>
**AI USED:** You can witness the use of AI as it suggest you what you can think of wearing considering your weather conditions (weather, humidity, wind, etc).
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/4df7c69a-8b92-49a3-8350-d552aa72ff30)

There are a few steps to get this AI suggestion:
- Step 1: Extract weather information received from Open Weather API
- Step 2: Make a fetch to the AI model with the current weather conditions
<img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/1a2b7171-84db-440f-9918-d13b7bd3a980" height="500">


Also, note that outfits do not have clothes, which temperature is outside too far from the current temperature (for over 10 degrees). In our case, current weather temperature is 12 degrees, so there are not clothes outside of range ~[2 degrees, 22 degrees]. 
<br>
Let's test that can test that. If we ecit all clothes for Casual occasion to have temperature below 0, we should not be shown Casual outfit at all (since all clothes don't match current weather conditions).
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/f9df99b1-1d70-4760-a1e2-34d11d99f83e)
As discussed, we cannot see Casual outfit anymore as neigher of casual clothes match current weather conditions.
![image](https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/66655b20-7b3d-43d7-a24b-231b73f3f78a)






# Clothes Mock Information

### Casual
| | Cloth 1 | Cloth 2 | Cloth 3 (optional) |
|-|---------| --------| ------------------ |
|Image| <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/f096c0d8-7b07-42f6-a644-27b9f2e08465" height="200"> | <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/92a69f20-eb09-4d68-b9d7-ead4d8bfcff8" height="200"> | <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/23cd0240-48d0-4890-903e-e1a5138f86ca" height="200"> |
|Name| Warm Trousers | Parka | Jeans |
|Type| Bottom | Top | Bottom |
|Occasion| Casual | Casual | Casual |
|Temperature | -15 | -5 | 5 |

### Formal
| | Cloth 1 | Cloth 2 |
|-|---------| --------|
|Image| <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/5e0c9780-7f30-4e51-aa44-676b432ca7fd" height="200"> | <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/ab0c0642-c2b8-4b56-9b36-2ad371585d35" height="200"> |
|Name| Pants | Shirt |
|Type| Bottom | Top |
|Occasion| Formal | Formal |
|Temperature | 10 | 12 |


### Sporty
| | Cloth 1 | Cloth 2 |
|-|---------| --------|
|Image| <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/20607848-31f8-42b0-8b3d-2957b1ef53b6" height="200"> | <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/0c41f9d9-27a8-47cf-8edc-8570d61767e9" height="200"> |
|Name| Shorts | T-Shirt |
|Type| Bottom | Top |
|Occasion| Sports | Sports |
|Temperature | 25 | 20 |

### Party
| | Cloth 1 | Cloth 2 |
|-|---------| --------|
|Image| <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/7cd552ca-f6c9-47dd-9b45-f1677e7a8ec2" height="200"> | <img src="https://github.com/dps970/final-project-mdmytrenko-astalwar/assets/79389256/97121d75-d5c8-4ae5-9a96-1864410527e1" height="200"> |
|Name| Cool Jeans | Vibe Button Down |
|Type| Bottom | Top |
|Occasion| Party | Party |
|Temperature | 5 | 15 |
