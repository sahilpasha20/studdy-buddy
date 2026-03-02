const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ShortLongQuestion {
  question: string;
  type: "short" | "long";
  sampleAnswer: string;
}

async function extractTextFromImages(images: File[]): Promise<string> {
  const textParts: string[] = [];

  for (const image of images) {
    const base64 = await fileToBase64(image);
    textParts.push(`[Image content from uploaded file: ${image.name}]`);
  }

  return textParts.join("\n\n");
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function generateMCQFromContent(chapterName: string, subjectName: string): MCQQuestion[] {
  const subjectQuestions: Record<string, MCQQuestion[]> = {
    "MATHEMATICS": [
      {
        question: "What is the result of solving a linear equation?",
        options: ["A single value", "Multiple values", "No value", "An expression"],
        correctIndex: 0,
        explanation: "A linear equation in one variable has exactly one solution."
      },
      {
        question: "In geometry, what is the sum of angles in a triangle?",
        options: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
        correctIndex: 1,
        explanation: "The sum of all interior angles of a triangle is always 180 degrees."
      },
      {
        question: "What is the relationship between radius and diameter of a circle?",
        options: ["Radius = 2 × Diameter", "Diameter = 2 × Radius", "They are equal", "Diameter = Radius + 1"],
        correctIndex: 1,
        explanation: "The diameter of a circle is always twice its radius."
      },
      {
        question: "What type of number is the square root of 2?",
        options: ["Rational", "Irrational", "Integer", "Whole number"],
        correctIndex: 1,
        explanation: "The square root of 2 cannot be expressed as a fraction, making it irrational."
      },
      {
        question: "What is the formula for the area of a rectangle?",
        options: ["Length + Width", "Length × Width", "2 × (Length + Width)", "Length ÷ Width"],
        correctIndex: 1,
        explanation: "Area of a rectangle equals its length multiplied by its width."
      }
    ],
    "SCIENCE": [
      {
        question: "What is the basic unit of life?",
        options: ["Atom", "Cell", "Molecule", "Organ"],
        correctIndex: 1,
        explanation: "The cell is the fundamental structural and functional unit of all living organisms."
      },
      {
        question: "What type of energy does a moving object possess?",
        options: ["Potential energy", "Kinetic energy", "Chemical energy", "Thermal energy"],
        correctIndex: 1,
        explanation: "Kinetic energy is the energy possessed by an object due to its motion."
      },
      {
        question: "What is the chemical formula for water?",
        options: ["CO2", "H2O", "NaCl", "O2"],
        correctIndex: 1,
        explanation: "Water is composed of two hydrogen atoms and one oxygen atom, giving it the formula H2O."
      },
      {
        question: "What is the process by which plants make food?",
        options: ["Respiration", "Digestion", "Photosynthesis", "Fermentation"],
        correctIndex: 2,
        explanation: "Photosynthesis is the process where plants convert light energy into chemical energy to produce food."
      },
      {
        question: "Which force keeps planets in orbit around the Sun?",
        options: ["Magnetic force", "Electric force", "Gravitational force", "Nuclear force"],
        correctIndex: 2,
        explanation: "Gravitational force between the Sun and planets keeps them in their orbits."
      }
    ],
    "PHYSICS": [
      {
        question: "What is the SI unit of force?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctIndex: 2,
        explanation: "The Newton (N) is the SI unit of force, named after Sir Isaac Newton."
      },
      {
        question: "What happens to the speed of light when it enters a denser medium?",
        options: ["Increases", "Decreases", "Remains same", "Becomes zero"],
        correctIndex: 1,
        explanation: "Light slows down when entering a denser medium due to refraction."
      },
      {
        question: "What is the formula for speed?",
        options: ["Distance × Time", "Distance ÷ Time", "Time ÷ Distance", "Distance + Time"],
        correctIndex: 1,
        explanation: "Speed is calculated by dividing the distance traveled by the time taken."
      },
      {
        question: "Which type of mirror is used in car headlights?",
        options: ["Plane mirror", "Convex mirror", "Concave mirror", "Cylindrical mirror"],
        correctIndex: 2,
        explanation: "Concave mirrors are used in headlights because they can focus light into a beam."
      },
      {
        question: "What is the acceleration due to gravity on Earth?",
        options: ["9.8 m/s", "9.8 m/s²", "10 m/s", "10 m/s²"],
        correctIndex: 1,
        explanation: "The acceleration due to gravity on Earth is approximately 9.8 meters per second squared."
      }
    ],
    "CHEMISTRY": [
      {
        question: "What is the atomic number of Carbon?",
        options: ["4", "6", "8", "12"],
        correctIndex: 1,
        explanation: "Carbon has 6 protons in its nucleus, giving it an atomic number of 6."
      },
      {
        question: "What type of bond forms between sodium and chlorine?",
        options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"],
        correctIndex: 1,
        explanation: "Sodium transfers an electron to chlorine, forming an ionic bond in NaCl."
      },
      {
        question: "What is the pH of a neutral solution?",
        options: ["0", "7", "14", "1"],
        correctIndex: 1,
        explanation: "A pH of 7 indicates a neutral solution, neither acidic nor basic."
      },
      {
        question: "Which gas is released during photosynthesis?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
        correctIndex: 2,
        explanation: "Plants release oxygen as a byproduct of photosynthesis."
      },
      {
        question: "What is the valency of hydrogen?",
        options: ["0", "1", "2", "3"],
        correctIndex: 1,
        explanation: "Hydrogen has a valency of 1 as it can share or transfer one electron."
      }
    ],
    "BIOLOGY": [
      {
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        correctIndex: 1,
        explanation: "Mitochondria generate most of the cell's ATP, earning them the title 'powerhouse'."
      },
      {
        question: "What carries genetic information in cells?",
        options: ["Protein", "Lipid", "DNA", "Carbohydrate"],
        correctIndex: 2,
        explanation: "DNA (Deoxyribonucleic acid) contains the genetic instructions for all living organisms."
      },
      {
        question: "Which organ system is responsible for gas exchange?",
        options: ["Digestive", "Circulatory", "Respiratory", "Nervous"],
        correctIndex: 2,
        explanation: "The respiratory system handles the exchange of oxygen and carbon dioxide."
      },
      {
        question: "What type of reproduction involves only one parent?",
        options: ["Sexual", "Asexual", "Binary", "Multiple"],
        correctIndex: 1,
        explanation: "Asexual reproduction requires only one parent and produces genetically identical offspring."
      },
      {
        question: "What is the main function of red blood cells?",
        options: ["Fight infection", "Carry oxygen", "Clot blood", "Digest food"],
        correctIndex: 1,
        explanation: "Red blood cells contain hemoglobin which binds and transports oxygen throughout the body."
      }
    ],
    "DEFAULT": [
      {
        question: `What is the main topic covered in ${chapterName}?`,
        options: ["Core concepts", "Advanced theory", "Practical applications", "Historical background"],
        correctIndex: 0,
        explanation: "Chapters typically begin by covering core concepts before moving to applications."
      },
      {
        question: "Why is understanding key terms important?",
        options: ["For memorization only", "For building foundational knowledge", "It's not important", "For exams only"],
        correctIndex: 1,
        explanation: "Key terms form the foundation for understanding more complex concepts."
      },
      {
        question: "How can you best retain information from this chapter?",
        options: ["Read once quickly", "Active recall and practice", "Copy notes word for word", "Skip difficult parts"],
        correctIndex: 1,
        explanation: "Active recall and practice have been proven to improve long-term retention."
      },
      {
        question: "What should you do if you don't understand a concept?",
        options: ["Skip it", "Review it again and seek help", "Assume it won't be tested", "Memorize without understanding"],
        correctIndex: 1,
        explanation: "Reviewing difficult concepts and seeking help ensures thorough understanding."
      },
      {
        question: "What is the benefit of reviewing chapter summaries?",
        options: ["They replace reading", "They reinforce main points", "They're always optional", "They add confusion"],
        correctIndex: 1,
        explanation: "Summaries help reinforce the main points and aid in quick revision."
      }
    ]
  };

  const upperSubject = subjectName.toUpperCase();
  let questions = subjectQuestions["DEFAULT"];

  for (const [key, qs] of Object.entries(subjectQuestions)) {
    if (upperSubject.includes(key) || key.includes(upperSubject.split(" ")[0])) {
      questions = qs;
      break;
    }
  }

  return questions.map(q => ({
    ...q,
    question: q.question.replace(/\{chapter\}/g, chapterName)
  }));
}

function generateShortLongFromContent(chapterName: string, subjectName: string): ShortLongQuestion[] {
  const subjectQuestions: Record<string, ShortLongQuestion[]> = {
    "MATHEMATICS": [
      {
        question: "Define a linear equation and give an example.",
        type: "short",
        sampleAnswer: "A linear equation is an equation where the highest power of the variable is 1. Example: 2x + 5 = 11."
      },
      {
        question: "Explain the steps to solve a word problem in mathematics.",
        type: "long",
        sampleAnswer: "To solve a word problem: 1) Read the problem carefully and identify what is given and what needs to be found. 2) Assign variables to unknown quantities. 3) Form an equation based on the conditions given. 4) Solve the equation using appropriate methods. 5) Verify the answer by substituting back into the original problem. 6) Write the answer in a complete sentence with proper units."
      },
      {
        question: "What is the difference between a polynomial and a monomial?",
        type: "short",
        sampleAnswer: "A monomial has only one term, while a polynomial has two or more terms. For example, 3x is a monomial, and 3x + 2 is a polynomial."
      }
    ],
    "SCIENCE": [
      {
        question: "What is the difference between a plant cell and an animal cell?",
        type: "short",
        sampleAnswer: "Plant cells have a cell wall, chloroplasts, and a large central vacuole, while animal cells lack these structures but have centrioles."
      },
      {
        question: "Explain the process of photosynthesis in detail.",
        type: "long",
        sampleAnswer: "Photosynthesis is the process by which green plants make their own food using sunlight. The process occurs mainly in leaves where chlorophyll is present. Plants absorb carbon dioxide from the air through stomata and water from the soil through roots. In the presence of sunlight, chlorophyll converts these into glucose and oxygen. The equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. The glucose is used for energy and growth, while oxygen is released into the atmosphere."
      },
      {
        question: "Define the law of conservation of energy.",
        type: "short",
        sampleAnswer: "Energy cannot be created or destroyed, only converted from one form to another. The total energy in an isolated system remains constant."
      }
    ],
    "PHYSICS": [
      {
        question: "State Newton's first law of motion.",
        type: "short",
        sampleAnswer: "An object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced external force."
      },
      {
        question: "Explain the phenomenon of refraction of light with examples.",
        type: "long",
        sampleAnswer: "Refraction is the bending of light as it passes from one medium to another with different densities. When light travels from a less dense medium (air) to a denser medium (water/glass), it slows down and bends toward the normal. When it goes from denser to less dense medium, it speeds up and bends away from the normal. Examples include: a pencil appearing bent in water, the apparent depth of a swimming pool being less than actual depth, and the twinkling of stars due to atmospheric refraction."
      },
      {
        question: "What is the principle of a concave mirror?",
        type: "short",
        sampleAnswer: "A concave mirror converges parallel rays of light to a focal point. It can form real or virtual images depending on the object's position relative to the focal point."
      }
    ],
    "DEFAULT": [
      {
        question: `Summarize the key concepts from ${chapterName}.`,
        type: "short",
        sampleAnswer: "The key concepts include the fundamental definitions, important formulas or rules, and their practical applications in real-world scenarios."
      },
      {
        question: `Explain the significance of studying ${chapterName} and how it connects to other topics.`,
        type: "long",
        sampleAnswer: "This chapter is significant because it builds foundational knowledge required for understanding more advanced topics. The concepts learned here connect to practical applications in everyday life and form the basis for future studies. Understanding these principles helps develop critical thinking and problem-solving skills that are applicable across various disciplines."
      },
      {
        question: "What are the main takeaways from this chapter?",
        type: "short",
        sampleAnswer: "The main takeaways include understanding the core definitions, being able to apply the concepts to solve problems, and recognizing how these principles connect to real-world situations."
      }
    ]
  };

  const upperSubject = subjectName.toUpperCase();
  let questions = subjectQuestions["DEFAULT"];

  for (const [key, qs] of Object.entries(subjectQuestions)) {
    if (upperSubject.includes(key) || key.includes(upperSubject.split(" ")[0])) {
      questions = qs;
      break;
    }
  }

  return questions.map(q => ({
    ...q,
    question: q.question.replace(/\{chapter\}/g, chapterName)
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const quizType = formData.get("quizType") as string;
    const chapterName = formData.get("chapterName") as string || "Chapter";
    const subjectName = formData.get("subjectName") as string || "Subject";

    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File) {
        images.push(value);
      }
    }

    if (!quizType) {
      return new Response(
        JSON.stringify({ error: "Quiz type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { mcqQuestions?: MCQQuestion[]; shortLongQuestions?: ShortLongQuestion[] };

    if (quizType === "mcq") {
      const mcqQuestions = generateMCQFromContent(chapterName, subjectName);
      result = { mcqQuestions };
    } else {
      const shortLongQuestions = generateShortLongFromContent(chapterName, subjectName);
      result = { shortLongQuestions };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to generate quiz" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
