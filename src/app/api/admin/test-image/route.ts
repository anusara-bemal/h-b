import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// This is a test endpoint to verify that the uploads directory is writable
export async function GET() {
  try {
    // Test directory paths
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
    const categoriesDir = path.join(baseUploadDir, 'categories');
    
    // Check if directories exist
    const baseExists = fs.existsSync(baseUploadDir);
    
    // Try to create the directories if they don't exist
    let baseCreated = false;
    let categoriesCreated = false;
    
    if (!baseExists) {
      try {
        fs.mkdirSync(baseUploadDir, { recursive: true });
        baseCreated = true;
      } catch (e) {
        console.error("Error creating base upload directory:", e);
      }
    }
    
    if (!fs.existsSync(categoriesDir)) {
      try {
        fs.mkdirSync(categoriesDir, { recursive: true });
        categoriesCreated = true;
      } catch (e) {
        console.error("Error creating categories directory:", e);
      }
    }
    
    // Check permissions by trying to write a test file
    let writeSuccess = false;
    const testFilePath = path.join(categoriesDir, 'test-file.txt');
    
    try {
      fs.writeFileSync(testFilePath, 'Test file to verify write permissions');
      writeSuccess = true;
      
      // Clean up the test file
      fs.unlinkSync(testFilePath);
    } catch (e) {
      console.error("Error writing test file:", e);
    }
    
    return NextResponse.json({
      message: "Directory check complete",
      directories: {
        base: {
          path: baseUploadDir,
          existed: baseExists,
          created: baseCreated
        },
        categories: {
          path: categoriesDir,
          existed: fs.existsSync(categoriesDir),
          created: categoriesCreated
        }
      },
      permissions: {
        canWrite: writeSuccess
      }
    });
  } catch (error) {
    console.error("Error in test-image endpoint:", error);
    return NextResponse.json(
      { error: "Directory test failed", details: error },
      { status: 500 }
    );
  }
} 