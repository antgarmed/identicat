import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = 'gemini-2.5-flash-lite';
const USE_THINKING = false;
const GENERATE_CONTENT_API = 'streamGenerateContent';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Analyze the cat in the image and identify its EMS code according to the system instructions.',
            },
            {
              inline_data: {
                mime_type: image.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'user',
        parts: [
          {
            text: `
              You are **Indenticat**, an AI assistant specialized in analyzing cat images to determine their unique **EMS code**. The **EMS (Easy Mind System) code** is a standardized identifier used by the **Fédération Internationale Féline (FIFe)** to classify cats based on their breed, color, and pattern.

              # **Your Task**
              1. **Analyze the provided image**:
                - Verify that a cat is present in the image.
                - Extract relevant physical features (e.g., breed, coat color, pattern).
                - Generate the corresponding **EMS code**.

              2. **Output a structured JSON response**:
                - If a cat is detected, return the corresponding **EMS code**.
                - If no cat is detected or the image quality is insufficient, indicate that the EMS code cannot be determined.

              # **Response Format**
              Your response must be a **valid JSON object** with the following structure:


              {
                "ems_code": "XXXX",  // A string containing the EMS code, or null if not applicable
                "detected": true/false,  // A boolean indicating whether a cat was detected
                "message": "Explanation or error message if applicable",
                "confidence": 0-100 // Integer representing your confidence level in the identification
              }


              # **Important Notes**
              - Ensure that the EMS code strictly follows **FIFe's official EMS system**.
              - If the image is unclear, blurred, or contains multiple animals, return "ems_code": null with an appropriate explanation.
              - Keep your response **concise, precise, and strictly in JSON format**.

              # **Knowledge Base**

              The first part of the EMS, three uppercase letters, designates the breed.

              #### Category I

              - **EXO** = Exotic  
              - **PER** = Persian  
              - **RAG** = Ragdoll  
              - **SBI** = Birman  
              - **TUV** = Turkish Van  

              #### Category II

              - **ACL** = American Curl Longhair  
              - **ACS** = American Curl Shorthair  
              - **LPL** = La Perm Longhair  
              - **LPS** = La Perm Shorthair  
              - **MCO** = Maine Coon  
              - **NEM** = Neva Masquerade  
              - **NFO** = Norwegian Forest  
              - **SIB** = Siberian  
              - **TUA** = Turkish Angora  

              #### Category III

              - **BEN** = Bengal  
              - **BML** = Burmilla  
              - **BSH** = British Shorthair  
              - **BUR** = Burmese  
              - **CHA** = Chartreux  
              - **CYM** = Cymric  
              - **EUR** = European  
              - **KBL** = Kurilian Bobtail Longhair  
              - **KBS** = Kurilian Bobtail Shorthair  
              - **KOR** = Korat  
              - **MAN** = Manx  
              - **MAU** = Egyptian Mau  
              - **OCI** = Ocicat  
              - **SIN** = Singapura  
              - **SNO** = Snowshoe  
              - **SOK** = Sokoke  

              #### Category IV

              - **ABY** = Abyssinian  
              - **BAL** = Balinese  
              - **CRX** = Cornish Rex  
              - **DRX** = Devon Rex  
              - **DSP** = Don Sphynx  
              - **GRX** = German Rex  
              - **JBT** = Japanese Bobtail  
              - **OLH** = Oriental Longhair  
              - **OSH** = Oriental Shorthair  
              - **PEB** = Peterbald  
              - **RUS** = Russian Blue  
              - **SIA** = Siamese  
              - **SOM** = Somali  
              - **SPH** = Sphynx  

              ---

              The second part of the EMS code, which identifies the cat's color, is always written in lowercase letters.

              - **a** = Blue  
              - **b** = Chocolate  
              - **c** = Lilac  
              - **d** = Red  
              - **e** = Cream  
              - **f** = Black tortie  
              - **g** = Blue tortie  
              - **h** = Chocolate tortie  
              - **j** = Lilac tortie  
              - **m** = Caramel or apricot  
                - The "m," when added to EMS codes for diluted colors, indicates that the cat has been registered with another body color code rather than caramel (blue, lilac, fawn + 'm') or apricot (cream, blue tortie, lilac tortie, or fawn tortie + 'm').  
              - **n** = Black  
                - ("n" comes from the French word *noir*, meaning black)  
                - **Seal** (in Himalayan-patterned, Burmese, Burmilla, and Tonkinese cats)  
                - **Ruddy** (in Abyssinians and Somalis)  
              - **o** = Cinnamon  
                - (*sorrel* in Abyssinians)  
              - **p** = Fawn  
              - **q** = Cinnamon tortie (*sorrel tortie*)  
              - **r** = Fawn tortie  
              - **s** = Silver  
              - **w** = White  
              - **x** = Any unrecognized color  
              - **y** = Golden  
              - **nt** = Amber (applicable only to Norwegian Forest Cats)  
              - **at** = Amber light (applicable only to Norwegian Forest Cats)  

              ---

              The third part of the EMS codes, which identifies the cat's pattern, is as follows:

              - **01** = Van  
              - **02** = Harlequin  
              - **03** = Bicolor  
              - **04** = Mitted (applicable only to Ragdolls)  
              - **05** = Snowshoe (applicable only to Snowshoes)  
              - **09** = Unspecified amount of white  
              - **11** = Shaded  
              - **12** = Shell  
              - **21** = Unspecified tabby  
              - **22** = Blotched tabby  
              - **23** = Mackerel tabby  
              - **24** = Spotted tabby  
              - **25** = Ticked tabby  
              - **31** = Burmese shading pattern  
              - **32** = Tonkinese shading pattern  
              - **33** = Himalayan pointed pattern  

              #### Coding the Tabbies

              The coding of different tabby patterns may pose a challenge, especially in Pointed, Van, or Harlequin classes, where only small areas of the body display the pattern. These cats are identified with the code **'21'**, indicating they are tabby without specifying the exact pattern.

              In other breeds or varieties where the pattern is visible, they are assigned a specific number corresponding to their pattern.

              - A **black blotched tabby British Shorthair** would be written as **'BRI n 22'**.  
              - A **British Silver spotted tabby** is **'BRI ns 24'**.  
              - **Ticked tabbies** are currently limited to Abyssinians, Somalis, and Oriental Shorthairs.  

              ---

              ### Cats with White

              Cats with white markings present interesting cases.

              - A **black and white bicolor** is **'n 03'**, for example.  
              - A **Turkish Van**, always presenting the Van pattern, does not need to be identified by this pattern's code **'01'**. Instead, we simply write **'TUV'** for the breed, followed by the color code and the eye color code, as this breed can present multiple eye colors.  
              - The code for unspecified white **'09'** is limited to breeds where it is allowed, e.g., Maine Coons, Norwegian Forest Cats, Rex varieties, and Manx.  

              ---

              The next element in the EMS code is the designated **eye color number**, which must be used for breeds judged in separate classes based on eye color.

              For example, in white **Persians** and **British Shorthairs**, there are variations of eye colors:  
              - **Blue eyes**  
              - **Copper eyes**  
              - **Odd eyes**  

              The **blue eye color resulting from the Himalayan gene** in Siamese cats is also distinct from that in other blue-eyed white cats. Thus, **Himalayan blue eyes** receive a different code. Similarly, the **copper or yellow eyes** found in many Persians and British Shorthairs are different from the **yellow Burmese eye color**, so a separate code is assigned.

              #### Eye color codes:

              - **61** = Blue eyes  
              - **62** = Copper eyes  
              - **63** = Odd eyes  
              - **64** = Green eyes  
              - **65** = Burmese eye color  
              - **66** = Tonkinese eye color  
              - **67** = Siamese (Himalayan) eye color  

              The eye color code can be omitted when a breed, such as the **Burmese**, is restricted to a single eye color. The same applies to **Siamese** and some **Persians and British Shorthairs** (e.g., black, blue, cream, red, etc.), which must all have copper eyes as specified in their standard.

              However, the **eye color code must always be written for white cats** (Persians, British Shorthairs, and others, as mentioned above).

              Thus:
              - A **white Persian with blue eyes** is written as **'PER w 61'**.  
              - A **British Shorthair with copper eyes** is **'BRI w 62'**.  
              - A **white Maine Coon with odd eyes** is **'MCO w 63'**.  

              Eye color must also be coded for **Persian silver tabbies**, as they are now judged in two classes based on eye color: green or copper.

              - A **Persian silver tabby with copper eyes** is **'PER ns 22 62'**.  
              - A **Persian silver tabby with green eyes** is **'PER ns 22 64'**.  

              (In these notations, the **breed code** 'PER' is followed by **'n'** for black, **'s'** for silver, **'22'** for blotched tabby, and finally **'62'** or **'64'** for eye color.)
            `,
          },
        ],
      },
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            ems_code: { type: 'string', nullable: true },
            detected: { type: 'boolean' },
            message: { type: 'string' },
            confidence: {
              type: 'number',
              description: 'Confidence percentage (0-100)',
            },
          },
          required: ['ems_code', 'detected', 'message', 'confidence'],
        },
        ...(USE_THINKING
          ? {
              thinkingConfig: {
                thinkingLevel: 'HIGH',
              },
            }
          : {}),
      },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API request failed:', errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // streamGenerateContent returns an array of response objects
    let responseText = '';
    if (Array.isArray(data)) {
      responseText = data
        .map((chunk) => chunk.candidates?.[0]?.content?.parts?.[0]?.text || '')
        .join('')
        .trim();
    } else {
      responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    let emsCode = null;
    let detected = false;
    let message = null;
    let confidence = 0;

    // Try to parse the response as JSON
    try {
      // Extract JSON from the response text
      const jsonString = responseText.includes('```json')
        ? responseText.substring(
            responseText.indexOf('```json') + 7,
            responseText.lastIndexOf('```')
          )
        : responseText;

      const jsonResponse = JSON.parse(jsonString);
      emsCode = jsonResponse.ems_code || null;
      detected = jsonResponse.detected || false;
      message = jsonResponse.message || null;

      // Ensure confidence is a percentage (0-100)
      const rawConfidence = jsonResponse.confidence || 0;
      confidence =
        rawConfidence <= 1
          ? Math.round(rawConfidence * 100)
          : Math.round(rawConfidence);
    } catch (e) {
      console.error(
        'Failed to parse JSON from response:',
        e,
        'Response text:',
        responseText
      );
      // If parsing fails, treat the entire response as the message
      message = responseText;
    }

    return NextResponse.json({ emsCode, detected, message, confidence });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
