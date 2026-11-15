#include "ASDCDuelPlayerController.h"
#include "ASDCDuelGameMode.h"
#include "Components/InputComponent.h"
#include "InputCoreTypes.h"
#include "Kismet/GameplayStatics.h"
void AASDCDuelPlayerController::BeginPlay(){
 Super::BeginPlay();
 bShowMouseCursor=true;
 FInputModeGameAndUI Mode;
 Mode.SetHideCursorDuringCapture(false);
 SetInputMode(Mode);
}
void AASDCDuelPlayerController::SetupInputComponent(){
 Super::SetupInputComponent();
 InputComponent->BindKey(EKeys::One,IE_Pressed,this,&AASDCDuelPlayerController::PlayCardOne);
 InputComponent->BindKey(EKeys::Two,IE_Pressed,this,&AASDCDuelPlayerController::PlayCardTwo);
 InputComponent->BindKey(EKeys::Three,IE_Pressed,this,&AASDCDuelPlayerController::PlayCardThree);
 InputComponent->BindKey(EKeys::LeftMouseButton,IE_Pressed,this,&AASDCDuelPlayerController::HandleCardClick);
}
void AASDCDuelPlayerController::PlayCardOne(){if(auto* G=GetWorld()->GetAuthGameMode<AASDCDuelGameMode>())G->PlayCard(0);}
void AASDCDuelPlayerController::PlayCardTwo(){if(auto* G=GetWorld()->GetAuthGameMode<AASDCDuelGameMode>())G->PlayCard(1);}
void AASDCDuelPlayerController::PlayCardThree(){if(auto* G=GetWorld()->GetAuthGameMode<AASDCDuelGameMode>())G->PlayCard(2);}
void AASDCDuelPlayerController::HandleCardClick(){
 float MouseX=0,MouseY=0;
 int32 SizeX=0,SizeY=0;
 GetViewportSize(SizeX,SizeY);
 if(SizeX<=0||SizeY<=0||!GetMousePosition(MouseX,MouseY))return;
 const float S=FMath::Max(.7f,FMath::Min(SizeX/1440.f,SizeY/900.f));
 if(MouseY<SizeY-108*S||MouseY>SizeY-28*S)return;
 for(int32 i=0;i<3;++i){
  const float Left=(34.f+i*465.f)*S;
  if(MouseX>=Left&&MouseX<=Left+434*S){
   if(auto* G=GetWorld()->GetAuthGameMode<AASDCDuelGameMode>())G->PlayCard(i);
   return;
  }
 }
}
void AASDCDuelPlayerController::ResetBattle(){}
