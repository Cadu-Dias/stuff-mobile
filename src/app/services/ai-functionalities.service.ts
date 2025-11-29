import httpClient from "./api";
import { decode as atob } from 'base-64';

export class AIFuncionalitiesService {
  public async generatePresignedUrl(filename: string): Promise<{ url: string; key: string }> {
    try {
      const filenameTreated = filename
        .replace(/ /g, "_")
        .replace(/-/g, "_")
        .toLowerCase();

      const response = await httpClient.post<{ url: string; key: string }>(
        "/ai-functionalities/presigned-url",
        { filename: filenameTreated, extension: "png" }
      );

      if (response.status !== 200) {
        throw new Error(response.statusText);
      }

      return response.data;
    } catch (error) {
      console.error("Erro ao gerar URL pré-assinada:", error);
      throw error;
    }
  }

 public async uploadImageBase64(presignedUrl: string, imageBase64: string): Promise<void> {
    try {
      const binaryString = atob(imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("✅ Upload feito com sucesso para o S3!");
            resolve();
          } else {
            reject(new Error(`Erro ao enviar: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Erro de rede'));
        xhr.ontimeout = () => reject(new Error('Timeout'));

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', 'image/png'); // MUDADO PARA PNG
        xhr.send(bytes);
      });

    } catch (error: any) {
      console.error("Erro no upload:", error?.message || error);
      throw error;
    }
  }

  public async describeImage(key: string, contextPrompt: string) {
    try {
      console.log(key, contextPrompt);
      
      const response = await httpClient.post(
        "/ai-functionalities/describe-image",
        {
          key: key,
          contextPrompt: contextPrompt,
        }
      );
      
      const aIResponse = response.data;

      const isAIResponseString = typeof aIResponse === "string";
      if (isAIResponseString && aIResponse.trim() === "") {
        throw new Error("Resposta vazia");
      }
      if (!aIResponse) {
        throw new Error("Valor indefinido");
      }

      let iaResponseJson: any;
      
      if (isAIResponseString) {
        const cleanedJSON = this.removeIncompleteObjects(aIResponse);
        iaResponseJson = JSON.parse(cleanedJSON);
      } else {
        iaResponseJson = aIResponse;
      }

      return iaResponseJson;
      
    } catch (error: any) {
      console.error("Erro ao descrever imagem:", error?.message || error);
      throw error;
    }
  }

  private removeIncompleteObjects(jsonString: string): string {
    let depth = 0;
    let lastCompleteIndex = -1;

    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === '{') {
        depth++;
      } else if (jsonString[i] === '}') {
        depth--;
        if (depth === 1) {
          lastCompleteIndex = i;
        }
      }
    }

    if (lastCompleteIndex > -1) {
      return jsonString.substring(0, lastCompleteIndex + 1) + '}';
    }

    return jsonString;
  }
}