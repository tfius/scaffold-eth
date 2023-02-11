
import { ethers } from "ethers";

export const categoryList = [
    { label: "General", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("General")).toString() },
    { label: "Text", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Text")).toString() },
    { label: "Image", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Image")).toString() },
    { label: "Data", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Data")).toString() },
    { label: "Map", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Map")).toString() },
    { label: "Audio", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio")).toString() },
    { label: "Video", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video")).toString() },
    { label: "Model", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Model")).toString() },
    { label: "Other", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Other")).toString() },
  
    { label: "Book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Book")).toString() },
    { label: "Fiction book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Fiction book")).toString() },
    { label: "Non-fiction book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Non-fiction book")).toString() },
    { label: "Short stories", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Short stories")).toString() },
  
    { label: "Membership", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Membership")).toString() },
    { label: "Planners", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Planners")).toString() },
    { label: "Guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Guides")).toString() },
    { label: "Drawing guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Drawing guides")).toString() },
    { label: "Travel guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Travel guides")).toString() },
    {
      label: "Self-publishing guides",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Self-publishing guides")).toString(),
    },
    { label: "Printout origami", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printout origami")).toString() },
    {
      label: "Printable coloring sheets",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable coloring sheets")).toString(),
    },
  
    { label: "Newsletter", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Newsletter")).toString() },
  
    {
      label: "E-learning course",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("E-learning course")).toString(),
    },
    { label: "Community", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Community")).toString() },
    { label: "Courses", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Courses")).toString() },
    {
      label: "Certified courses",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Certified courses")).toString(),
    },
    { label: "Audio course", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio course")).toString() },
    { label: "Video course", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video course")).toString() },
  
    { label: "Journals", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Journal")).toString() },
    {
      label: "Printable journals",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable journal")).toString(),
    },
  
    { label: "Tracker", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Tracker")).toString() },
    { label: "Wellness tracker", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Wellness tracker")).toString() },
  
    { label: "Wallpapers", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Wallpapers")).toString() },
    { label: "Emojis", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Emojis")).toString() },
    { label: "Posters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Posters")).toString() },
    { label: "Fonts", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Fonts")).toString() },
    { label: "Templates", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Templates")).toString() },
    {
      label: "3D printer design files",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D printer design files")).toString(),
    },
    { label: "3D design files", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D design files")).toString() },
    { label: "3D files", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D files")).toString() },
    { label: "Sets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Sets")).toString() },
    { label: "Icon sets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Icon sets")).toString() },
    { label: "Animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Animations")).toString() },
    { label: "Video animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video animations")).toString() },
    { label: "3D animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D animations")).toString() },
    {
      label: "Cartoon animations",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Cartoon animations")).toString(),
    },
  
    { label: "Designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Designs")).toString() },
    {
      label: "Architectural designs",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Architectural designs")).toString(),
    },
    { label: "Graphic designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Graphic designs")).toString() },
    { label: "Premade designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Premade designs")).toString() },
  
    { label: "Games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("games")).toString() },
    { label: "Video games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video games")).toString() },
    { label: "Mobile games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile games")).toString() },
    { label: "Desktop games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop games")).toString() },
    { label: "Console games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Console games")).toString() },
    { label: "Board games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Board games")).toString() },
    { label: "Card games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Card games")).toString() },
    {
      label: "Printable games and riddles",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable games and riddles")).toString(),
    },
  
    { label: "Themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Themes")).toString() },
    { label: "Website themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Website themes")).toString() },
    { label: "Music themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Music themes")).toString() },
    { label: "Video themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video themes")).toString() },
    { label: "Slide themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Slide themes")).toString() },
    {
      label: "Spreadsheet themes",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Spreadsheet themes")).toString(),
    },
  
    { label: "Software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Software")).toString() },
    { label: "Desktop software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop software")).toString() },
    { label: "Mobile software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile software")).toString() },
    { label: "Web software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Web software")).toString() },
    { label: "Apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Apps")).toString() },
    { label: "Web apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Web apps")).toString() },
    { label: "Mobile apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile apps")).toString() },
    { label: "Desktop apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop apps")).toString() },
  
    { label: "Plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Plugins")).toString() },
    { label: "Browser plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Browser plugins")).toString() },
    { label: "Audio plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio plugins")).toString() },
    { label: "Video plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video plugins")).toString() },
  
    { label: "Hosting", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hosting")).toString() },
    { label: "Code snippets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Code snippets")).toString() },
    { label: "Integrations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Integrations")).toString() },
    { label: "Podcast", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Podcast")).toString() },
    { label: "Careers advice", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Careers advice")).toString() },
    { label: "Masterclasses", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Masterclasses")).toString() },
    { label: "Resources", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Resources")).toString() },
  
    { label: "Deleted chapters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Deleted chapters")).toString() },
    { label: "Spin-offs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Spin-offs")).toString() },
  
    { label: "Extra scenes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Extra scenes")).toString() },
  
    {
      label: "Novel planning sheet",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Novel planning sheet")).toString(),
    },
    { label: "Tutorials", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Tutorials")).toString() },
    {
      label: "Painting video tutorials",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Painting video tutorials")).toString(),
    },
    {
      label: "Videography tutorials",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Videography tutorials")).toString(),
    },
    { label: "Music tutorials", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Music tutorials")).toString() },
  
    { label: "Designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Designs")).toString() },
    {
      label: "Clip art pictures",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Clip art pictures")).toString(),
    },
    { label: "Clip art symbols", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Clip art symbols")).toString() },
  
    { label: "Cooking", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Cooking")).toString() },
    { label: "Recipe books", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Recipe books")).toString() },
    { label: "Nutrition", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Nutrition")).toString() },
    { label: "Nutrition plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Nutrition plans")).toString() },
    { label: "Meal-prep plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Meal-prep plans")).toString() },
  
    { label: "Health", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Health")).toString() },
    { label: "Healthy living", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Healthy living")).toString() },
    {
      label: "Home recipes for healthy skin",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Home recipes for healthy skin")).toString(),
    },
    {
      label: "Hair and makeup tutorials",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hair and makeup tutorials")).toString(),
    },
  
    { label: "Audiobook", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audiobook")).toString() },
    { label: "Kids’ audiobook", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Kids’ audiobook")).toString() },
    {
      label: "Activities",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Activities")).toString(),
    },
    { label: "Trips", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Trips")).toString() },
    {
      label: "Field trips and activities",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Field trips and activities")).toString(),
    },
    {
      label: "Virtual field trips and activities",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Virtual field trips and activities")).toString(),
    },
  
    { label: "Songs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Songs")).toString() },
    { label: "Album", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Album")).toString() },
    {
      label: "Downloadable songs",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Downloadable songs")).toString(),
    },
    { label: "Playlist", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Playlist")).toString() },
    { label: "Sound effects", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Sound effects")).toString() },
    { label: "Voiceovers", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Voiceovers")).toString() },
    {
      label: "Instrumental tracks",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Instrumental tracks")).toString(),
    },
    { label: "Beats", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Beats")).toString() },
    { label: "Workout plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Workout plans")).toString() },
    {
      label: "Workout video",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Workout video")).toString(),
    },
  
    { label: "Presets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Presets")).toString() },
    {
      label: "Presets and filters",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Presets and filters")).toString(),
    },
    { label: "LUTs and presets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LUTs and presets")).toString() },
    { label: "Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Filters")).toString() },
    { label: "Audio Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio Filters")).toString() },
    { label: "Video Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video Filters")).toString() },
    { label: "Stock photos", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Stock photo")).toString() },
    { label: "Stock video", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Stock video")).toString() },
    { label: "Short films", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Short films")).toString() },
    {
      label: "Video animation intros",
      value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video animation intros")),
    },
  ];