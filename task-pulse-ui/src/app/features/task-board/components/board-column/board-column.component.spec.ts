import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardColumnComponent } from './board-column.component';
import { Column, TaskPriority } from '../../models';

describe('BoardColumnComponent', () => {
  let component: BoardColumnComponent;
  let fixture: ComponentFixture<BoardColumnComponent>;

  const mockColumn: Column = {
    id: 'col-101',
    boardId: 'b-1',
    title: 'In Progress',
    position: 1,
    colorHex: '#3B82F6',
    wipLimit: 3,
    tasks: [
      {
        id: 't-1',
        columnId: 'col-101',
        title: 'Task A',
        position: 0,
        priority: TaskPriority.Medium,
        labels: [],
        createdAt: '2026-11-01T00:00:00Z',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardColumnComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('column', mockColumn);
    fixture.detectChanges();
  });

  it('should render column title and WIP counter', () => {
    const titleEl = fixture.nativeElement.querySelector('.board-column__title');
    expect(titleEl.textContent.trim()).toBe('In Progress');

    const countEl = fixture.nativeElement.querySelector('.count-badge');
    expect(countEl.textContent.trim()).toBe('1/3');
  });

  it('should emit addTask event with columnId when plus button is clicked', () => {
    let addedColId: string | null = null;
    component.addTask.subscribe((colId: string) => (addedColId = colId));

    const addBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.add-task-btn');
    addBtn.click();

    expect(addedColId as string | null).toBe('col-101');
  });

  it('should render empty state when tasks list is empty', () => {
    fixture.componentRef.setInput('column', {
      ...mockColumn,
      tasks: [],
    });
    fixture.detectChanges();

    const emptyDropzone = fixture.nativeElement.querySelector('.empty-dropzone');
    expect(emptyDropzone).toBeTruthy();
  });

  it('should emit taskDrop event when onDrop is invoked with moved item', () => {
    let droppedEvent: any = null;
    component.taskDrop.subscribe((e) => (droppedEvent = e));

    const mockDropEvent: any = {
      item: { data: mockColumn.tasks[0] },
      previousContainer: { id: 'col-101' },
      container: { id: 'col-102' },
      previousIndex: 0,
      currentIndex: 1,
    };

    component.onDrop(mockDropEvent);

    expect(droppedEvent).toBeTruthy();
    expect(droppedEvent.task.id).toBe('t-1');
    expect(droppedEvent.sourceColumnId).toBe('col-101');
    expect(droppedEvent.targetColumnId).toBe('col-102');
    expect(droppedEvent.currentIndex).toBe(1);
  });

  it('should not emit taskDrop if dropped in same position within same container', () => {
    let droppedEvent: any = null;
    component.taskDrop.subscribe((e) => (droppedEvent = e));

    const mockDropEvent: any = {
      item: { data: mockColumn.tasks[0] },
      previousContainer: { id: 'col-101' },
      container: { id: 'col-101' },
      previousIndex: 0,
      currentIndex: 0,
    };

    component.onDrop(mockDropEvent);

    expect(droppedEvent).toBeNull();
  });
});
